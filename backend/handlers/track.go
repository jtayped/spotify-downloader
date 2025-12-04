package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

// GetTrackDetails returns the Spotify specific data (Detailed DTO)
func (h *Handler) GetTrackDetails(c echo.Context) error {
	id := c.Param("id")
	ctx := c.Request().Context()

	track, err := h.Spotify.GetTrack(ctx, id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, track)
}

// GetTrackVideo is the "Bridge" endpoint.
// It takes a Spotify Track ID -> Gets Info -> Finds YouTube Video -> Returns URL
func (h *Handler) GetTrackVideo(c echo.Context) error {
	id := c.Param("id")
	ctx := c.Request().Context()

	// 1. Fetch Track Metadata from Spotify (to ensure we have accurate duration/artist)
	track, err := h.Spotify.GetTrack(ctx, id)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Spotify track not found"})
	}

	// 2. Prepare Search Query
	// Use the first artist for the search
	artistName := "Unknown Artist"
	if len(track.Artists) > 0 {
		artistName = track.Artists[0].Name
	}

	// 3. Search YouTube for closest match
	videoID, err := h.YouTube.FindClosestVideoID(ctx, artistName, track.Name, track.DurationMs)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "No matching YouTube video found"})
	}

	// 4. Return the full YouTube URL
	return c.JSON(http.StatusOK, map[string]string{
		"youtube_id":  videoID,
		"youtube_url": fmt.Sprintf("https://www.youtube.com/watch?v=%s", videoID),
	})
}

// DownloadTrackAudio finds the video and streams the raw audio to the client
func (h *Handler) DownloadTrackAudio(c echo.Context) error {
	id := c.Param("id")
	ctx := c.Request().Context()

	// 1. Fetch Track Metadata (We need this for the filename)
	track, err := h.Spotify.GetTrack(ctx, id)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Spotify track not found"})
	}

	// 2. Determine Artist Name for search
	artistName := "Unknown Artist"
	if len(track.Artists) > 0 {
		artistName = track.Artists[0].Name
	}

	// 3. Find the YouTube Video ID
	videoID, err := h.YouTube.FindClosestVideoID(ctx, artistName, track.Name, track.DurationMs)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "No matching YouTube video found"})
	}

	// 4. Start the Audio Stream
	// This returns the IO stream and the running command
	stream, cmd, err := h.YouTube.GetAudioStream(ctx, videoID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to start audio stream"})
	}

	// IMPORTANT: Cleanup resources when the request finishes
	// We defer the Wait() so that after the stream is fully copied to the user,
	// the Go process waits for the yt-dlp process to exit cleanly to avoid "zombies".
	defer func() {
		stream.Close()
		_ = cmd.Wait() 
	}()

	// 5. Sanitize Filename
	// Remove slashes to prevent directory issues in filenames
	safeTitle := strings.ReplaceAll(fmt.Sprintf("%s - %s", artistName, track.Name), "/", "-")
	filename := fmt.Sprintf("%s.mp3", safeTitle)

	// 6. Set Response Headers for Download
	c.Response().Header().Set(echo.HeaderContentDisposition, fmt.Sprintf("attachment; filename=%q", filename))
	
	// 7. Stream the data!
	// "application/octet-stream" tells the browser this is binary data to be saved
	return c.Stream(http.StatusOK, "application/octet-stream", stream)
}