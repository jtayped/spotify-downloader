package services

import (
	"backend/models"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// WriteMP3Metadata uses ffmpeg to embed Spotify track metadata as ID3v2.3 tags.
// ID3v2.3 is used for maximum compatibility (Windows Media Player, VLC, etc).
// The original file is replaced in-place with the tagged version.
func WriteMP3Metadata(filePath string, track models.TrackDTO) error {
	absPath, err := filepath.Abs(filePath)
	if err != nil {
		return fmt.Errorf("abs path: %w", err)
	}

	if _, err := os.Stat(absPath); err != nil {
		return fmt.Errorf("source file not found at %q: %w", absPath, err)
	}

	taggedPath := absPath + ".tagged.mp3"

	coverPath := ""
	if track.Album.ImageURL != "" {
		p, err := downloadCoverArt(track.Album.ImageURL)
		if err != nil {
			log.Printf("[metadata] cover art fetch for %q: %v", track.Name, err)
		} else {
			coverPath = p
			defer os.Remove(coverPath)
		}
	}

	artistNames := make([]string, len(track.Artists))
	for i, a := range track.Artists {
		artistNames[i] = a.Name
	}

	args := []string{"-y", "-loglevel", "warning", "-i", absPath}

	if coverPath != "" {
		args = append(args, "-i", coverPath)
		args = append(args, "-map", "0:a", "-map", "1:v")
		args = append(args, "-c:v", "copy")
	} else {
		args = append(args, "-map", "0:a")
	}

	args = append(args,
		"-c:a", "copy",
		"-map_metadata", "-1",
		"-id3v2_version", "3",
		"-write_id3v1", "1",
		"-metadata", "title="+track.Name,
		"-metadata", "artist="+strings.Join(artistNames, ", "),
		"-metadata", "album="+track.Album.Name,
	)

	if len(artistNames) > 0 {
		args = append(args, "-metadata", "album_artist="+artistNames[0])
	}
	if year := extractYear(track.Album.ReleaseDate); year != "" {
		args = append(args, "-metadata", "date="+year)
	}
	if track.TrackNumber > 0 {
		args = append(args, "-metadata", fmt.Sprintf("track=%d", track.TrackNumber))
	}
	if track.DiscNumber > 0 {
		args = append(args, "-metadata", fmt.Sprintf("disc=%d", track.DiscNumber))
	}
	if track.ExternalURL != "" {
		args = append(args, "-metadata", "comment="+track.ExternalURL)
	}

	args = append(args, taggedPath)

	log.Printf("[metadata] tagging %q", filepath.Base(absPath))
	cmd := exec.Command("ffmpeg", args...)
	out, err := cmd.CombinedOutput()
	if err != nil {
		os.Remove(taggedPath)
		return fmt.Errorf("ffmpeg failed: %v\nffmpeg output:\n%s", err, string(out))
	}
	if len(out) > 0 {
		log.Printf("[metadata] ffmpeg: %s", strings.TrimSpace(string(out)))
	}

	if err := os.Rename(taggedPath, absPath); err != nil {
		os.Remove(taggedPath)
		return fmt.Errorf("rename tagged file: %w", err)
	}

	log.Printf("[metadata] done: %q", filepath.Base(absPath))
	return nil
}

func downloadCoverArt(url string) (string, error) {
	resp, err := http.Get(url) //nolint:noctx
	if err != nil {
		return "", fmt.Errorf("fetch: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("fetch: HTTP %d", resp.StatusCode)
	}

	ext := ".jpg"
	if strings.Contains(resp.Header.Get("Content-Type"), "png") {
		ext = ".png"
	}

	tmp, err := os.CreateTemp("", "cover_*"+ext)
	if err != nil {
		return "", fmt.Errorf("create temp file: %w", err)
	}
	defer tmp.Close()

	if _, err := io.Copy(tmp, resp.Body); err != nil {
		os.Remove(tmp.Name())
		return "", fmt.Errorf("write temp file: %w", err)
	}

	return tmp.Name(), nil
}

// sanitizeFilename removes characters that are invalid in Windows filenames
// so that our computed path matches what yt-dlp actually writes on disk.
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

func extractYear(releaseDate string) string {
	if len(releaseDate) >= 4 {
		return releaseDate[:4]
	}
	return ""
}
