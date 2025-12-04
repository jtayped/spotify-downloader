package services

import (
	"archive/zip"
	"backend/models"
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

// Orchestrator implements the queue.DownloadService interface
type Orchestrator struct {
	Spotify *SpotifyService
	YouTube *YouTubeService
}

// ProcessDownloadJob is called by the Queue worker in the background
func (o *Orchestrator) ProcessDownloadJob(ctx context.Context, job models.Job, progressChan chan<- models.ProgressMessage) error {
	// 1. Setup Temporary Directories
	// We need a folder to hold the MP3s before zipping: ./tmp/{jobID}_raw/
	tempDir := filepath.Join("tmp", fmt.Sprintf("%s_raw", job.ID))
	finalZipPath := filepath.Join("tmp", fmt.Sprintf("%s.zip", job.ID))

	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return fmt.Errorf("failed to create temp dir: %w", err)
	}
	
	// Ensure cleanup of the raw files, even if the job fails
	defer os.RemoveAll(tempDir) 

	// 2. Fetch Playlist Tracks
	progressChan <- models.ProgressMessage{Type: "progress", Message: "Fetching playlist info..."}
	
	tracks, err := o.Spotify.GetPlaylistItems(ctx, job.PlaylistID)
	if err != nil {
		return fmt.Errorf("failed to fetch playlist: %w", err)
	}

	totalTracks := len(tracks)
	if totalTracks == 0 {
		return fmt.Errorf("playlist is empty")
	}

	// 3. Download Loop (Sequential for safety, or Semaphore for parallel)
	// We will use a Semaphore to allow 3 concurrent downloads, similar to before
	maxConcurrency := 3
	sem := make(chan struct{}, maxConcurrency)
	var wg sync.WaitGroup
	
	// Error channel to catch issues inside goroutines
	errChan := make(chan error, totalTracks)

	for i, track := range tracks {
		if ctx.Err() != nil {
			return ctx.Err()
		}

		wg.Add(1)
		sem <- struct{}{} // Acquire token

		go func(index int, t models.TrackDTO) {
			defer wg.Done()
			defer func() { <-sem }() // Release token

			// Calculate "Base Progress" for this track (e.g., Track 1 is 0-10%, Track 2 is 10-20%)
			baseProgress := (float64(index) / float64(totalTracks)) * 100
			stepSize := 100.0 / float64(totalTracks)

			// A. Find Video
			artistName := "Unknown"
			if len(t.Artists) > 0 {
				artistName = t.Artists[0].Name
			}

			// Notify: "Searching..."
			progressChan <- models.ProgressMessage{
				Type:     "progress",
				Message:  fmt.Sprintf("Searching: %s - %s", artistName, t.Name),
				Progress: baseProgress,
			}

			videoID, err := o.YouTube.FindClosestVideoID(ctx, artistName, t.Name, t.DurationMs)
			if err != nil {
				// Log error but don't stop the whole job
				fmt.Printf("Failed to find video for %s: %v\n", t.Name, err)
				return
			}

			// B. Download MP3
			// We define a callback to update the WebSocket as yt-dlp runs
			updateCallback := func(dlPct float64) {
				// Calculate global progress
				// currentTotal = base + ( (track_percentage / 100) * step_size )
				globalPct := baseProgress + ((dlPct / 100.0) * stepSize)
				
				progressChan <- models.ProgressMessage{
					Type:     "progress",
					Message:  fmt.Sprintf("Downloading: %s", t.Name),
					Progress: globalPct,
				}
			}

			// Construct a safe filename
			safeTitle := strings.ReplaceAll(fmt.Sprintf("%s - %s", artistName, t.Name), "/", "-")
			filename := fmt.Sprintf("%s.mp3", safeTitle)
			filePath := filepath.Join(tempDir, filename)

			err = o.YouTube.DownloadToFile(ctx, videoID, filePath, updateCallback)
			if err != nil {
				fmt.Printf("Failed to download %s: %v\n", t.Name, err)
				return
			}

		}(i, track)
	}

	// Wait for all downloads to finish
	wg.Wait()
	close(errChan)

	// Check for critical errors (optional logic here)

	// 4. Create ZIP File
	progressChan <- models.ProgressMessage{Type: "progress", Message: "Zipping files...", Progress: 99}

	if err := zipFolder(tempDir, finalZipPath); err != nil {
		return fmt.Errorf("failed to zip files: %w", err)
	}

	return nil
}

// Helper: Zip the contents of sourceDir into targetZip
func zipFolder(sourceDir, targetZip string) error {
	zipFile, err := os.Create(targetZip)
	if err != nil {
		return err
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

		// Get the relative path for the zip entry (e.g., "song.mp3" instead of "tmp/123/song.mp3")
		relPath, err := filepath.Rel(sourceDir, path)
		if err != nil {
			return err
		}

		writer, err := archive.Create(relPath)
		if err != nil {
			return err
		}

		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()

		_, err = io.Copy(writer, file)
		return err
	})
}