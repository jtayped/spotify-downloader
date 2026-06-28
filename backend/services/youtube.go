package services

import (
	"backend/models"
	"bufio"
	"bytes"
	"context"
	"encoding/base64"
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

// resolveCookiesPath returns the path to a valid cookies.txt, writing it from
// COOKIES_B64 if necessary. Priority: file at COOKIES_PATH → file at ../cookies.txt
// → decode COOKIES_B64 → hard error.
func resolveCookiesPath() (string, error) {
	target := os.Getenv("COOKIES_PATH")
	if target == "" {
		cwd, _ := os.Getwd()
		target = filepath.Join(cwd, "..", "cookies.txt")
	}

	if _, err := os.Stat(target); err == nil {
		return target, nil
	}

	b64 := os.Getenv("COOKIES_B64")
	if b64 == "" {
		return "", fmt.Errorf("cookies.txt not found at %s and COOKIES_B64 is not set", target)
	}

	data, err := base64.StdEncoding.DecodeString(b64)
	if err != nil {
		return "", fmt.Errorf("COOKIES_B64 is not valid base64: %w", err)
	}

	if err := os.WriteFile(target, data, 0600); err != nil {
		return "", fmt.Errorf("failed to write cookies.txt from COOKIES_B64 to %s: %w", target, err)
	}

	log.Printf("[youtube] wrote cookies.txt from COOKIES_B64 to %s", target)
	return target, nil
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
	cookiesPath, err := resolveCookiesPath()
	if err != nil {
		return fmt.Errorf("youtube: download %s: %w", videoID, err)
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

		stderrStr, err := s.downloadWithClient(ctx, videoID, targetPath, cookiesPath, client, cb)
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

func (s *YouTubeService) downloadWithClient(ctx context.Context, videoID, targetPath, cookiesPath, playerClient string, progressCallback func(float64)) (stderrOutput string, err error) {
	// Clean up any partial file left by a previous attempt.
	os.Remove(targetPath)
	os.Remove(targetPath + ".part")

	args := []string{
		"--cookies", cookiesPath,
		"-x", "--audio-format", "mp3",
		"--extractor-args", "youtube:player_client=" + playerClient,
		"--min-sleep-interval", "5",
		"--max-sleep-interval", "15",
		"-o", targetPath,
		"--newline",
		"https://www.youtube.com/watch?v=" + videoID,
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
