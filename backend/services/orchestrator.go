package services

import (
	"archive/zip"
	"backend/models"
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

// Orchestrator implements the queue.DownloadService interface.
type Orchestrator struct {
	Spotify *SpotifyService
	YouTube *YouTubeService

	// downloadSem caps how many tracks are downloaded/processed at once,
	// across every job — Orchestrator is a singleton shared by all queue
	// workers, so this channel is the same one for every job that ever runs.
	downloadSem chan struct{}
}

// NewOrchestrator constructs an Orchestrator with the given service dependencies.
// maxConcurrentDownloads bounds how many tracks (search + download + tag) run at
// once system-wide, regardless of how many jobs or users are active.
func NewOrchestrator(spotify *SpotifyService, youtube *YouTubeService, maxConcurrentDownloads int) *Orchestrator {
	return &Orchestrator{
		Spotify:     spotify,
		YouTube:     youtube,
		downloadSem: make(chan struct{}, maxConcurrentDownloads),
	}
}

// ProcessDownloadJob is called by the Queue worker in the background.
func (o *Orchestrator) ProcessDownloadJob(ctx context.Context, job models.Job, progressChan chan<- models.ProgressMessage) error {
	// 1. Setup temporary directories
	tempDir := filepath.Join("tmp", fmt.Sprintf("%s_raw", job.ID))
	finalZipPath := filepath.Join("tmp", fmt.Sprintf("%s.zip", job.ID))

	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return fmt.Errorf("orchestrator: create temp dir: %w", err)
	}
	defer os.RemoveAll(tempDir)

	// 2. Fetch tracks (playlist or album)
	progressChan <- models.ProgressMessage{Type: "progress", Message: "fetching track list…"}

	var (
		tracks []models.TrackDTO
		err    error
	)
	switch job.Type {
	case models.JobTypeAlbum:
		tracks, err = o.Spotify.GetAlbumItems(ctx, job.ItemID)
		if err != nil {
			return fmt.Errorf("orchestrator: fetch album: %w", err)
		}
	case models.JobTypeTrack:
		tracks, err = o.Spotify.GetTrackItem(ctx, job.ItemID)
		if err != nil {
			return fmt.Errorf("orchestrator: fetch track: %w", err)
		}
	default:
		tracks, err = o.Spotify.GetPlaylistItems(ctx, job.ItemID)
		if err != nil {
			return fmt.Errorf("orchestrator: fetch playlist: %w", err)
		}
	}

	totalTracks := len(tracks)
	if totalTracks == 0 {
		return fmt.Errorf("orchestrator: no tracks found for job")
	}

	// 3. Download loop — throttled by the orchestrator's global download semaphore
	var wg sync.WaitGroup
	errChan := make(chan error, totalTracks)

	// Label/copyright require a separate Spotify call per album (not included in
	// the track list response), so cache results across tracks that share an album.
	type albumExtras struct{ label, copyright string }
	var albumExtrasMu sync.Mutex
	albumExtrasCache := make(map[string]albumExtras)

	// Records each successful track's final filename/display info in original
	// order for the .m3u8 playlist file. Goroutines finish out of order, but
	// each only ever touches its own index, so no locking is needed.
	type trackResult struct {
		filename    string
		artist      string
		title       string
		durationSec int
	}
	results := make([]*trackResult, totalTracks)

	for i, track := range tracks {
		if ctx.Err() != nil {
			return fmt.Errorf("orchestrator: context cancelled: %w", ctx.Err())
		}

		wg.Add(1)
		o.downloadSem <- struct{}{}

		go func(index int, t models.TrackDTO) {
			defer wg.Done()
			defer func() { <-o.downloadSem }()

			baseProgress := (float64(index) / float64(totalTracks)) * 100
			stepSize := 100.0 / float64(totalTracks)

			artistName := "Unknown"
			if len(t.Artists) > 0 {
				artistName = t.Artists[0].Name
			}

			progressChan <- models.ProgressMessage{
				Type:     "progress",
				Message:  fmt.Sprintf("searching for %s by %s", t.Name, artistName),
				Progress: baseProgress,
			}

			videoID, err := o.YouTube.FindClosestVideoID(ctx, artistName, t.Name, t.DurationMs)
			if err != nil {
				errChan <- fmt.Errorf("orchestrator: find video for %q: %w", t.Name, err)
				return
			}

			updateCallback := func(dlPct float64) {
				globalPct := baseProgress + ((dlPct / 100.0) * stepSize)
				progressChan <- models.ProgressMessage{
					Type:     "progress",
					Message:  t.Name,
					Progress: globalPct,
				}
			}

			safeTitle := sanitizeFilename(fmt.Sprintf("%s - %s", artistName, t.Name))
			basePath := filepath.Join(tempDir, safeTitle)

			finalPath, err := o.YouTube.DownloadToFile(ctx, videoID, basePath, job.Options.Format, job.Options.Quality, updateCallback)
			if err != nil {
				errChan <- fmt.Errorf("orchestrator: download %q: %w", t.Name, err)
				return
			}
			log.Printf("[orchestrator] downloaded %q to %s", t.Name, finalPath)

			if job.Options.Format == models.AudioFormatOriginal {
				// No tagging pipeline exists for native YouTube containers
				// (m4a/opus) yet — the file is left exactly as yt-dlp wrote it.
				results[index] = &trackResult{filename: filepath.Base(finalPath), artist: artistName, title: t.Name, durationSec: t.DurationMs / 1000}
				return
			}

			if t.Album.ID != "" {
				albumExtrasMu.Lock()
				extras, cached := albumExtrasCache[t.Album.ID]
				albumExtrasMu.Unlock()

				if !cached {
					label, copyright, err := o.Spotify.GetAlbumExtras(ctx, t.Album.ID)
					if err != nil {
						log.Printf("[orchestrator] album extras for %q: %v", t.Album.Name, err)
					}
					extras = albumExtras{label: label, copyright: copyright}
					albumExtrasMu.Lock()
					albumExtrasCache[t.Album.ID] = extras
					albumExtrasMu.Unlock()
				}

				t.Album.Label = extras.label
				t.Album.Copyright = extras.copyright
			}

			if err := WriteMP3Metadata(finalPath, t, job.Options.CoverMode); err != nil {
				log.Printf("[orchestrator] metadata FAILED for %q: %v", t.Name, err)
			} else {
				log.Printf("[orchestrator] metadata OK for %q", t.Name)
			}

			results[index] = &trackResult{filename: filepath.Base(finalPath), artist: artistName, title: t.Name, durationSec: t.DurationMs / 1000}
		}(i, track)
	}

	wg.Wait()
	close(errChan)

	for err := range errChan {
		log.Printf("[orchestrator] track error: %v", err)
	}

	// Folder-cover mode: one shared cover.jpg instead of per-track embedded art.
	// Only meaningful for albums (every track shares the same artwork) tagged as
	// MP3 — "original" format skips tagging entirely, so there's no per-track
	// embed to opt out of in the first place.
	if job.Options.CoverMode == models.CoverFolder && job.Type == models.JobTypeAlbum &&
		job.Options.Format != models.AudioFormatOriginal && tracks[0].Album.ImageURL != "" {
		data, _, err := fetchCoverArt(tracks[0].Album.ImageURL)
		if err != nil {
			log.Printf("[orchestrator] folder cover art: %v", err)
		} else if err := os.WriteFile(filepath.Join(tempDir, "cover.jpg"), data, 0644); err != nil {
			log.Printf("[orchestrator] write folder cover art: %v", err)
		}
	}

	// Playlist file: skip for single-track jobs, and skip any track that failed.
	if job.Options.IncludeM3U && job.Type != models.JobTypeTrack {
		var m3u strings.Builder
		m3u.WriteString("#EXTM3U\n")
		for _, r := range results {
			if r == nil {
				continue
			}
			fmt.Fprintf(&m3u, "#EXTINF:%d,%s - %s\n%s\n", r.durationSec, r.artist, r.title, r.filename)
		}
		if err := os.WriteFile(filepath.Join(tempDir, "playlist.m3u8"), []byte(m3u.String()), 0644); err != nil {
			log.Printf("[orchestrator] write playlist.m3u8: %v", err)
		}
	}

	// 4. Create ZIP file
	progressChan <- models.ProgressMessage{Type: "progress", Message: "zipping files…", Progress: 99}

	if err := zipFolder(tempDir, finalZipPath); err != nil {
		return fmt.Errorf("orchestrator: zip files: %w", err)
	}

	return nil
}

// zipFolder zips the contents of sourceDir into targetZip.
func zipFolder(sourceDir, targetZip string) error {
	zipFile, err := os.Create(targetZip)
	if err != nil {
		return fmt.Errorf("create zip file: %w", err)
	}
	defer zipFile.Close()

	archive := zip.NewWriter(zipFile)
	defer archive.Close()

	return filepath.Walk(sourceDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}

		relPath, err := filepath.Rel(sourceDir, path)
		if err != nil {
			return fmt.Errorf("rel path for %s: %w", path, err)
		}

		writer, err := archive.Create(relPath)
		if err != nil {
			return fmt.Errorf("create zip entry %s: %w", relPath, err)
		}

		file, err := os.Open(path)
		if err != nil {
			return fmt.Errorf("open file %s: %w", path, err)
		}
		defer file.Close()

		if _, err = io.Copy(writer, file); err != nil {
			return fmt.Errorf("write zip entry %s: %w", relPath, err)
		}
		return nil
	})
}
