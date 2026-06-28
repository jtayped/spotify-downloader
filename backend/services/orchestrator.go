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
	"sync"
)

// Orchestrator implements the queue.DownloadService interface.
type Orchestrator struct {
	Spotify *SpotifyService
	YouTube *YouTubeService
}

// NewOrchestrator constructs an Orchestrator with the given service dependencies.
func NewOrchestrator(spotify *SpotifyService, youtube *YouTubeService) *Orchestrator {
	return &Orchestrator{Spotify: spotify, YouTube: youtube}
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
	progressChan <- models.ProgressMessage{Type: "progress", Message: "Fetching track list..."}

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
	default:
		tracks, err = o.Spotify.GetPlaylistItems(ctx, job.ItemID)
		if err != nil {
			return fmt.Errorf("orchestrator: fetch playlist: %w", err)
		}
	}

	totalTracks := len(tracks)
	if totalTracks == 0 {
		return fmt.Errorf("orchestrator: playlist is empty")
	}

	// 3. Download loop — up to 3 concurrent downloads via semaphore
	maxConcurrency := 3
	sem := make(chan struct{}, maxConcurrency)
	var wg sync.WaitGroup
	errChan := make(chan error, totalTracks)

	for i, track := range tracks {
		if ctx.Err() != nil {
			return fmt.Errorf("orchestrator: context cancelled: %w", ctx.Err())
		}

		wg.Add(1)
		sem <- struct{}{}

		go func(index int, t models.TrackDTO) {
			defer wg.Done()
			defer func() { <-sem }()

			baseProgress := (float64(index) / float64(totalTracks)) * 100
			stepSize := 100.0 / float64(totalTracks)

			artistName := "Unknown"
			if len(t.Artists) > 0 {
				artistName = t.Artists[0].Name
			}

			progressChan <- models.ProgressMessage{
				Type:     "progress",
				Message:  fmt.Sprintf("Searching: %s - %s", artistName, t.Name),
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
			filePath := filepath.Join(tempDir, fmt.Sprintf("%s.mp3", safeTitle))

			if err := o.YouTube.DownloadToFile(ctx, videoID, filePath, updateCallback); err != nil {
				errChan <- fmt.Errorf("orchestrator: download %q: %w", t.Name, err)
				return
			}

			if err := WriteMP3Metadata(filePath, t); err != nil {
				log.Printf("[orchestrator] metadata for %q: %v", t.Name, err)
			}
		}(i, track)
	}

	wg.Wait()
	close(errChan)

	for err := range errChan {
		log.Printf("[orchestrator] track error: %v", err)
	}

	// 4. Create ZIP file
	progressChan <- models.ProgressMessage{Type: "progress", Message: "Zipping files...", Progress: 99}

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
