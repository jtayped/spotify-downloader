package services

import (
	"backend/models"
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
)

// WriteMP3Metadata embeds Spotify metadata into an MP3 using ffmpeg (-c:a copy,
// so no audio re-encoding). Cover art is downloaded and attached as an APIC
// frame, unless coverMode is CoverFolder — in that case the caller is writing
// a single shared cover.jpg instead, so no per-track art is embedded here.
// The file is rewritten atomically via a temp path.
func WriteMP3Metadata(filePath string, track models.TrackDTO, coverMode models.CoverMode) error {
	if _, err := os.Stat(filePath); err != nil {
		return fmt.Errorf("source file not found at %q: %w", filePath, err)
	}

	ffmpegPath, err := exec.LookPath("ffmpeg")
	if err != nil {
		return fmt.Errorf("ffmpeg not found in PATH: %w", err)
	}

	artistNames := make([]string, len(track.Artists))
	for i, a := range track.Artists {
		artistNames[i] = a.Name
	}

	// Download cover art to a temp file.
	var coverPath string
	if coverMode != models.CoverFolder && track.Album.ImageURL != "" {
		data, _, err := fetchCoverArt(track.Album.ImageURL)
		if err != nil {
			log.Printf("[metadata] cover art for %q: %v", track.Name, err)
		} else {
			f, err := os.CreateTemp("", "cover-*.jpg")
			if err == nil {
				if _, werr := f.Write(data); werr == nil {
					coverPath = f.Name()
				}
				f.Close()
				if coverPath != "" {
					defer os.Remove(coverPath)
				}
			}
		}
	}

	tmpPath := filePath + ".tmp.mp3"
	defer os.Remove(tmpPath)

	args := []string{"-i", filePath}
	if coverPath != "" {
		args = append(args, "-i", coverPath)
	}

	// Map audio from first input; image from second (if present).
	args = append(args, "-map", "0:a")
	if coverPath != "" {
		// "comment" on the picture stream is how ffmpeg's id3v2 muxer picks the APIC
		// picture type; without it, the frame defaults to type 0 ("Other"), which
		// Windows Explorer/Media Player and some VLC skins won't render as cover art.
		args = append(args, "-map", "1:0", "-c:v", "copy", "-disposition:v:0", "attached_pic",
			"-metadata:s:v", "comment=Cover (front)")
	}

	args = append(args, "-c:a", "copy", "-id3v2_version", "3")

	args = append(args, "-metadata", "title="+track.Name)
	args = append(args, "-metadata", "artist="+strings.Join(artistNames, ", "))
	args = append(args, "-metadata", "album="+track.Album.Name)
	if track.Album.ReleaseDate != "" {
		// ffmpeg's id3v2.3 muxer auto-splits a full "YYYY-MM-DD" date into TYER +
		// TDAT; a "YYYY" or "YYYY-MM" value degrades gracefully to TYER alone.
		args = append(args, "-metadata", "date="+track.Album.ReleaseDate)
	}
	if len(artistNames) > 0 {
		args = append(args, "-metadata", "album_artist="+artistNames[0])
	}
	if track.TrackNumber > 0 {
		trackNum := fmt.Sprintf("%d", track.TrackNumber)
		if track.Album.TotalTracks > 0 {
			trackNum = fmt.Sprintf("%d/%d", track.TrackNumber, track.Album.TotalTracks)
		}
		args = append(args, "-metadata", "track="+trackNum)
	}
	if track.DiscNumber > 0 {
		args = append(args, "-metadata", fmt.Sprintf("disc=%d", track.DiscNumber))
	}
	if track.ISRC != "" {
		// TSRC is a real ID3v2.3 frame ID, so passing it directly writes a native
		// text frame instead of falling back to a generic TXXX frame.
		args = append(args, "-metadata", "TSRC="+track.ISRC)
	}
	if track.Album.Label != "" {
		args = append(args, "-metadata", "publisher="+track.Album.Label)
	}
	if track.Album.Copyright != "" {
		args = append(args, "-metadata", "copyright="+track.Album.Copyright)
	}
	explicitFlag := "0"
	if track.Explicit {
		explicitFlag = "1"
	}
	args = append(args, "-metadata", "ITUNESADVISORY="+explicitFlag)
	if track.ExternalURL != "" {
		args = append(args, "-metadata", "Spotify URL="+track.ExternalURL)
	}

	args = append(args, "-y", tmpPath)

	log.Printf("[metadata] running: %s %v", ffmpegPath, args)
	cmd := exec.Command(ffmpegPath, args...)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("ffmpeg tagging %q: %w\n%s", track.Name, err, stderr.String())
	}

	// Atomic replace: remove original then rename temp into place.
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("remove original %q: %w", filePath, err)
	}
	if err := os.Rename(tmpPath, filePath); err != nil {
		return fmt.Errorf("rename tagged file %q: %w", filePath, err)
	}

	log.Printf("[metadata] done: %q", track.Name)
	return nil
}

func fetchCoverArt(url string) ([]byte, string, error) {
	resp, err := http.Get(url) //nolint:noctx
	if err != nil {
		return nil, "", fmt.Errorf("fetch: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, "", fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	mime := "image/jpeg"
	if strings.Contains(resp.Header.Get("Content-Type"), "png") {
		mime = "image/png"
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", fmt.Errorf("read body: %w", err)
	}
	return data, mime, nil
}

// sanitizeFilename removes characters invalid in Windows filenames so our
// computed path matches what yt-dlp writes on disk.
func sanitizeFilename(name string) string {
	r := strings.NewReplacer(
		"/", "-",
		"\\", "-",
		":", " -",
		"*", "",
		"?", "",
		"\"", "",
		"<", "",
		">", "",
		"|", "",
	)
	name = r.Replace(name)
	name = strings.TrimRight(name, ". ")
	return name
}
