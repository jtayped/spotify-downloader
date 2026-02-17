package services

import (
	"archive/zip"
	"backend/models" // Import models
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"
)

type YouTubeService struct {
	binPath string
}

func NewYouTubeService() (*YouTubeService, error) {
	path, err := exec.LookPath("yt-dlp")
	if err != nil {
		return nil, fmt.Errorf("yt-dlp binary not found in PATH")
	}
	return &YouTubeService{binPath: path}, nil
}

func parseProgress(line string) float64 {
    re := regexp.MustCompile(`\[download\]\s+(\d+\.?\d*)%`)
    matches := re.FindStringSubmatch(line)
    if len(matches) > 1 {
        val, _ := strconv.ParseFloat(matches[1], 64)
        return val
    }
    return 0
}

// DownloadWithProgress runs yt-dlp and writes progress to a callback channel
func (s *YouTubeService) DownloadWithProgress(ctx context.Context, videoID string, progressCallback func(float64)) (string, error) {
	// Get the current working directory (should be /backend)
    cwd, _ := os.Getwd()
    cookiesPath := filepath.Join(cwd, "cookies.txt")
    
    outputPath := fmt.Sprintf("./tmp/%s.mp3", videoID)

    cmd := exec.CommandContext(ctx, s.binPath,
        "-x", "--audio-format", "mp3",
        "--cookies", cookiesPath, // Use the absolute path
        "-o", outputPath,
        "--newline",
        videoID,
    )

    // 2. Capture Stdout
    stdout, _ := cmd.StdoutPipe()
    cmd.Start()

    // 3. Scan Output for Progress
    scanner := bufio.NewScanner(stdout)
    for scanner.Scan() {
        line := scanner.Text()
        if strings.Contains(line, "[download]") && strings.Contains(line, "%") {
             pct := parseProgress(line)
             if pct > 0 {
                 progressCallback(pct)
             }
        }
    }

    err := cmd.Wait()
    return outputPath, err
}

// GetAudioStream starts yt-dlp and returns the stdout pipe
func (s *YouTubeService) GetAudioStream(ctx context.Context, videoID string) (io.ReadCloser, *exec.Cmd, error) {
    // Construct command: yt-dlp -f bestaudio -o - [videoID]
    cmd := exec.CommandContext(ctx, s.binPath,
        "-f", "bestaudio", // Best audio quality
        "-o", "-",         // Output to Stdout
        "--quiet",         // Suppress logs
        "--no-warnings",   // Suppress warnings
        videoID,
    )

    // Capture Stderr for debugging (optional, but recommended)
    cmd.Stderr = os.Stderr

    // Create the StdoutPipe
    stdout, err := cmd.StdoutPipe()
    if err != nil {
        return nil, nil, fmt.Errorf("failed to get stdout pipe: %w", err)
    }

    // Start the command (Non-blocking)
    if err := cmd.Start(); err != nil {
        return nil, nil, fmt.Errorf("failed to start yt-dlp process: %w", err)
    }

    return stdout, cmd, nil
}

func (s *YouTubeService) FindClosestVideoID(ctx context.Context, artist, title string, targetDurationMs int) (string, error) {
	query := fmt.Sprintf("ytsearch5:%s - %s lyrics", artist, title)
	
	cmd := exec.CommandContext(ctx, s.binPath,
		"--dump-json", "--flat-playlist", "--no-warnings", "--quiet", query,
	)

	outputBytes, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to run yt-dlp: %w", err)
	}

	var candidates []models.YtDlpResult // Uses the model from package models
	lines := strings.Split(string(outputBytes), "\n")

	for _, line := range lines {
		if strings.TrimSpace(line) == "" { continue }
		var r models.YtDlpResult
		if err := json.Unmarshal([]byte(line), &r); err != nil { continue }
		candidates = append(candidates, r)
	}

	if len(candidates) == 0 {
		return "", fmt.Errorf("no videos found")
	}

	// Logic: Find Closest Duration
	bestVideoID := ""
	shortestDiff := math.MaxFloat64
	targetSeconds := float64(targetDurationMs) / 1000.0

	for _, video := range candidates {
		diff := math.Abs(video.Duration - targetSeconds)
		if diff < 1.5 { return video.ID, nil }
		if diff < shortestDiff {
			shortestDiff = diff
			bestVideoID = video.ID
		}
	}

	if bestVideoID == "" { return "", fmt.Errorf("no match found") }
	return bestVideoID, nil
}

func (s *YouTubeService) StreamPlaylistToZipParallel(ctx context.Context, w io.Writer, tracks []models.TrackDTO) error {
	fmt.Println("TODO> REMOVE")
	zipWriter := zip.NewWriter(w)
	defer zipWriter.Close()

	// 1. Setup concurrency control
	// "sem" acts as a Semaphore. It limits us to 3 concurrent downloads.
	// Increasing this risks an IP ban from YouTube.
	maxConcurrency := 3
	sem := make(chan struct{}, maxConcurrency)
	
	// WaitGroup to ensure we wait for all downloads to finish before closing the zip
	var wg sync.WaitGroup

	// Mutex to ensure only one goroutine writes to the ZIP stream at a time
	var zipMu sync.Mutex

	// Capture logs safely
	var logMu sync.Mutex
	logBuf := new(strings.Builder)

	// Add log file at the end
	defer func() {
		zipMu.Lock()
		f, _ := zipWriter.Create("download_log.txt")
		f.Write([]byte(logBuf.String()))
		zipMu.Unlock()
	}()

	// 2. Loop through tracks and spawn goroutines
	for i, track := range tracks {
		fmt.Println(track.Name)
		// Check context before starting new work
		if ctx.Err() != nil {
			break
		}

		wg.Add(1)

		// Acquire a slot in the semaphore (blocks if 3 are already running)
		sem <- struct{}{}

		go func(idx int, t models.TrackDTO) {
			defer wg.Done()
			defer func() { <-sem }() // Release slot when done

			// A. Generate Filename
			safeTitle := strings.ReplaceAll(t.Name, "/", "-")
			filename := fmt.Sprintf("%s.mp3", safeTitle)

			// B. Download to RAM Buffer
			// We cannot write directly to zipWriter here because it's not thread-safe.
			// We download to a temporary byte buffer first.
			var buf bytes.Buffer
			
			// Find ID
			videoID, err := s.FindClosestVideoID(ctx, t.Artists[0].Name, t.Name, t.DurationMs)
			if err != nil {
				logError(&logMu, logBuf, fmt.Sprintf("Skipped '%s': Not found (%v)\n", filename, err))
				return
			}

			// Stream Audio
			stream, cmd, err := s.GetAudioStream(ctx, videoID)
			if err != nil {
				logError(&logMu, logBuf, fmt.Sprintf("Skipped '%s': Stream failed (%v)\n", filename, err))
				return
			}
			
			// Copy stream to RAM buffer
			_, err = io.Copy(&buf, stream)
			stream.Close()
			cmd.Wait() // Clean up process

			if err != nil {
				logError(&logMu, logBuf, fmt.Sprintf("Error downloading '%s': %v\n", filename, err))
				return
			}

			// C. Write to ZIP (Critical Section)
			// Only one goroutine can write to the zip at a time.
			zipMu.Lock()
			defer zipMu.Unlock()

			// Check context again before writing
			if ctx.Err() != nil {
				return
			}

			zipEntry, err := zipWriter.Create(filename)
			if err != nil {
				logError(&logMu, logBuf, fmt.Sprintf("Failed to zip '%s': %v\n", filename, err))
				return
			}

			_, err = zipEntry.Write(buf.Bytes())
			if err == nil {
				logError(&logMu, logBuf, fmt.Sprintf("Downloaded: %s\n", filename))
			}
			
		}(i, track)
	}

	// 3. Wait for all downloads to complete
	wg.Wait()

	return nil
}

// DownloadToFile runs yt-dlp and saves the file to a specific path
func (s *YouTubeService) DownloadToFile(ctx context.Context, videoID, targetPath string, progressCallback func(float64)) error {
	cwd, _ := os.Getwd()
    cookiesPath := filepath.Join(cwd, "cookies.txt")

    // Verify file exists
    if _, err := os.Stat(cookiesPath); os.IsNotExist(err) {
        return fmt.Errorf("cookies.txt missing at: %s", cookiesPath)
    }

    cmd := exec.CommandContext(ctx, s.binPath,
        "-x", "--audio-format", "mp3",
        "--cookies", cookiesPath,
        "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", // <--- ADD THIS
        "-o", targetPath,
        "--newline",
        "https://www.youtube.com/watch?v="+videoID,
    )

    // 2. Create pipes for BOTH Stdout and Stderr
    stdout, err := cmd.StdoutPipe()
    if err != nil {
        return fmt.Errorf("failed to get stdout: %w", err)
    }
    
    stderr, err := cmd.StderrPipe()
    if err != nil {
        return fmt.Errorf("failed to get stderr: %w", err)
    }

    // 3. Start the process
    if err := cmd.Start(); err != nil {
        return fmt.Errorf("failed to start yt-dlp: %w", err)
    }

    // 4. Capture Stderr in a separate goroutine
    var stderrBuf bytes.Buffer
    go func() {
        io.Copy(&stderrBuf, stderr)
    }()

    // 5. Parse progress from Stdout (Main thread)
    scanner := bufio.NewScanner(stdout)
    for scanner.Scan() {
        line := scanner.Text()
        if strings.Contains(line, "[download]") && strings.Contains(line, "%") {
            pct := parseProgress(line)
            if pct > 0 {
                progressCallback(pct)
            }
        }
    }

    // 6. Wait for finish and check error
    if err := cmd.Wait(); err != nil {
        return fmt.Errorf("yt-dlp failed: %v | Stderr: %s", err, stderrBuf.String())
    }

    return nil
}

// Helper to write logs thread-safely
func logError(mu *sync.Mutex, buf *strings.Builder, msg string) {
	mu.Lock()
	defer mu.Unlock()
	buf.WriteString(msg)
	log.Print(msg) // Also print to server console
}