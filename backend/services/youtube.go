package services

import (
	"backend/models"
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

func resolveCookiesPath() (string, bool) {
	if p := os.Getenv("COOKIES_PATH"); p != "" {
		if _, err := os.Stat(p); err == nil {
			return p, true
		}
		log.Printf("[youtube] COOKIES_PATH set to %q but file not found, proceeding without cookies", p)
		return "", false
	}
	cwd, _ := os.Getwd()
	p := filepath.Join(cwd, "..", "cookies.txt")
	if _, err := os.Stat(p); err == nil {
		return p, true
	}
	return "", false
}

// isNonRetriable returns true for errors that will not improve with a different player client.
func isNonRetriable(stderr string) bool {
	permanent := []string{
		"Video unavailable",
		"This video has been removed",
		"Private video",
		"has been removed by the user",
		"This video is not available",
	}
	for _, pat := range permanent {
		if strings.Contains(stderr, pat) {
			return true
		}
	}
	return false
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

// DownloadToFile downloads a YouTube video as MP3, retrying with alternate player
// clients if the first attempt fails. progressCallback receives 0–100 percentages.
func (s *YouTubeService) DownloadToFile(ctx context.Context, videoID, targetPath string, progressCallback func(float64)) error {
	cookiesPath, hasCookies := resolveCookiesPath()
	if !hasCookies {
		log.Printf("[youtube] no cookies.txt found, downloading without cookies")
	}

	playerClients := []string{"default,-tv", "web", "mweb"}
	var lastErr error

	for i, client := range playerClients {
		if ctx.Err() != nil {
			return ctx.Err()
		}

		// Only forward progress on the first attempt to avoid backwards jumps in the UI.
		cb := progressCallback
		if i > 0 {
			log.Printf("[youtube] retrying %s with player_client=%s", videoID, client)
			cb = func(float64) {}
		}

		stderrStr, err := s.downloadWithClient(ctx, videoID, targetPath, cookiesPath, hasCookies, client, cb)
		if err == nil {
			return nil
		}

		if isNonRetriable(stderrStr) {
			return fmt.Errorf("youtube: download %s: permanent error: %s", videoID, stderrStr)
		}

		log.Printf("[youtube] download %s failed (client=%s): %v", videoID, client, err)
		lastErr = err
	}

	return fmt.Errorf("youtube: download %s: all player clients failed: %w", videoID, lastErr)
}

func (s *YouTubeService) downloadWithClient(ctx context.Context, videoID, targetPath, cookiesPath string, hasCookies bool, playerClient string, progressCallback func(float64)) (stderrOutput string, err error) {
	// Clean up any partial file left by a previous attempt.
	os.Remove(targetPath)
	os.Remove(targetPath + ".part")

	args := []string{
		"-x", "--audio-format", "mp3",
		"--extractor-args", "youtube:player_client=" + playerClient,
		"--min-sleep-interval", "5",
		"--max-sleep-interval", "15",
		"-o", targetPath,
		"--newline",
		"https://www.youtube.com/watch?v=" + videoID,
	}

	if hasCookies {
		args = append([]string{"--cookies", cookiesPath}, args...)
	}

	cmd := exec.CommandContext(ctx, s.binPath, args...)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return "", fmt.Errorf("stdout pipe: %w", err)
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		return "", fmt.Errorf("stderr pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		return "", fmt.Errorf("start process: %w", err)
	}

	var stderrBuf bytes.Buffer
	go func() { io.Copy(&stderrBuf, stderr) }()

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
		return stderrBuf.String(), fmt.Errorf("yt-dlp exited with error: %w", err)
	}

	return "", nil
}
