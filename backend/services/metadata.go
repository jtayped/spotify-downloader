package services

import (
	"backend/models"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	id3 "github.com/bogem/id3v2/v2"
)

// WriteMP3Metadata embeds Spotify track metadata as ID3v2.3 tags directly in Go
// using bogem/id3v2. This avoids shelling out to ffmpeg and handles the APIC
// (attached picture) frame correctly for VLC / Windows Media Player compatibility.
func WriteMP3Metadata(filePath string, track models.TrackDTO) error {
	if _, err := os.Stat(filePath); err != nil {
		return fmt.Errorf("source file not found at %q: %w", filePath, err)
	}

	tag, err := id3.Open(filePath, id3.Options{Parse: false})
	if err != nil {
		return fmt.Errorf("open mp3 for tagging: %w", err)
	}
	defer tag.Close()

	tag.SetVersion(3) // ID3v2.3 — widest player support

	artistNames := make([]string, len(track.Artists))
	for i, a := range track.Artists {
		artistNames[i] = a.Name
	}

	tag.SetTitle(track.Name)
	tag.SetArtist(strings.Join(artistNames, ", "))
	tag.SetAlbum(track.Album.Name)

	if year := extractYear(track.Album.ReleaseDate); year != "" {
		tag.SetYear(year)
	}
	if len(artistNames) > 0 {
		tag.AddTextFrame("TPE2", id3.EncodingUTF8, artistNames[0])
	}
	if track.TrackNumber > 0 {
		tag.AddTextFrame("TRCK", id3.EncodingUTF8, fmt.Sprintf("%d", track.TrackNumber))
	}
	if track.DiscNumber > 0 {
		tag.AddTextFrame("TPOS", id3.EncodingUTF8, fmt.Sprintf("%d", track.DiscNumber))
	}
	if track.ExternalURL != "" {
		tag.AddCommentFrame(id3.CommentFrame{
			Encoding:    id3.EncodingUTF8,
			Language:    "eng",
			Description: "",
			Text:        track.ExternalURL,
		})
	}

	if track.Album.ImageURL != "" {
		data, mime, err := fetchCoverArt(track.Album.ImageURL)
		if err != nil {
			log.Printf("[metadata] cover art for %q: %v", track.Name, err)
		} else {
			tag.AddAttachedPicture(id3.PictureFrame{
				Encoding:    id3.EncodingUTF8,
				MimeType:    mime,
				PictureType: id3.PTFrontCover,
				Description: "Cover",
				Picture:     data,
			})
		}
	}

	if err := tag.Save(); err != nil {
		return fmt.Errorf("save id3 tags: %w", err)
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
