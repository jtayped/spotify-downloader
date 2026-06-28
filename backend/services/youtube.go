package services

import (
	"backend/models"
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

type YouTubeService struct {
	binPath string
}

// NewYouTubeService locates the yt-dlp binary and returns a YouTubeService.
// Panics if yt-dlp is not found in PATH.
func NewYouTubeService() *YouTubeService {
	path, err := exec.LookPath("yt-dlp")
	if err != nil {
		panic("yt-dlp binary not found in PATH: install yt-dlp and ensure it is on PATH")
	}
	return &YouTubeService{binPath: path}
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

// GetAudioStream starts yt-dlp and returns the stdout pipe for raw audio streaming.
func (s *YouTubeService) GetAudioStream(ctx context.Context, videoID string) (io.ReadCloser, *exec.Cmd, error) {
	cmd := exec.CommandContext(ctx, s.binPath,
		"-f", "bestaudio",
		"-o", "-",
		"--quiet",
		"--no-warnings",
		videoID,
	)

	cmd.Stderr = os.Stderr

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, nil, fmt.Errorf("youtube: get audio stream: stdout pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		return nil, nil, fmt.Errorf("youtube: get audio stream: start process: %w", err)
	}

	return stdout, cmd, nil
}

// FindClosestVideoID searches YouTube for the top-5 results and returns the video ID
// whose duration best matches targetDurationMs.
func (s *YouTubeService) FindClosestVideoID(ctx context.Context, artist, title string, targetDurationMs int) (string, error) {
	query := fmt.Sprintf("ytsearch5:%s - %s lyrics", artist, title)

	cmd := exec.CommandContext(ctx, s.binPath,
		"--dump-json", "--flat-playlist", "--no-warnings", "--quiet", query,
	)

	outputBytes, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("youtube: find video for %q by %q: yt-dlp search failed: %w", title, artist, err)
	}

	var candidates []models.YtDlpResult
	for _, line := range strings.Split(string(outputBytes), "\n") {
		if strings.TrimSpace(line) == "" {
			continue
		}
		var r models.YtDlpResult
		if err := json.Unmarshal([]byte(line), &r); err != nil {
			continue
		}
		candidates = append(candidates, r)
	}

	if len(candidates) == 0 {
		return "", fmt.Errorf("youtube: find video for %q by %q: no results", title, artist)
	}

	bestVideoID := ""
	shortestDiff := math.MaxFloat64
	targetSeconds := float64(targetDurationMs) / 1000.0

	for _, video := range candidates {
		diff := math.Abs(video.Duration - targetSeconds)
		if diff < 1.5 {
			return video.ID, nil
		}
		if diff < shortestDiff {
			shortestDiff = diff
			bestVideoID = video.ID
		}
	}

	if bestVideoID == "" {
		return "", fmt.Errorf("youtube: find video for %q by %q: no duration match found", title, artist)
	}
	return bestVideoID, nil
}

// DownloadToFile runs yt-dlp with MP3 extraction and saves the result to targetPath.
// progressCallback is invoked with a 0–100 percentage as yt-dlp reports progress.
func (s *YouTubeService) DownloadToFile(ctx context.Context, videoID, targetPath string, progressCallback func(float64)) error {
	cwd, _ := os.Getwd()
	cookiesPath := filepath.Join(cwd, "..", "cookies.txt")

	if _, err := os.Stat(cookiesPath); os.IsNotExist(err) {
		return fmt.Errorf("youtube: download: cookies.txt missing at: %s", cookiesPath)
	}

	cmd := exec.CommandContext(ctx, s.binPath,
		"-x", "--audio-format", "mp3",
		"--cookies", cookiesPath,
		"--min-sleep-interval", "5",
		"--max-sleep-interval", "15",
		"--extractor-args", "youtube:player_client=default,-tv",
		"-o", targetPath,
		"--newline",
		"https://www.youtube.com/watch?v="+videoID,
	)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return fmt.Errorf("youtube: download: stdout pipe: %w", err)
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		return fmt.Errorf("youtube: download: stderr pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("youtube: download: start process: %w", err)
	}

	var stderrBuf bytes.Buffer
	go func() {
		io.Copy(&stderrBuf, stderr)
	}()

	scanner := bufio.NewScanner(stdout)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.Contains(line, "[download]") && strings.Contains(line, "%") {
			if pct := parseProgress(line); pct > 0 {
				progressCallback(pct)
			}
		}
	}

	if err := cmd.Wait(); err != nil {
		return fmt.Errorf("youtube: download: yt-dlp failed: %v | stderr: %s", err, stderrBuf.String())
	}

	return nil
}
