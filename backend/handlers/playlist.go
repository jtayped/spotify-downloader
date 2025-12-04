package handlers

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

// Note: type Handler is already defined in track.go, so we just attach methods to it here.

func (h *Handler) GetPlaylist(c echo.Context) error {
	id := c.Param("id")
	ctx := c.Request().Context()

	// Parse Params
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit == 0 {
		limit = 25
	}
	offset, _ := strconv.Atoi(c.QueryParam("offset"))

	// Call Service
	// We can access h.Spotify here because the Handler struct in track.go has it
	data, err := h.Spotify.GetPlaylist(ctx, id, offset, limit)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, data)
}

func (h *Handler) DownloadPlaylist(c echo.Context) error {
	id := c.Param("id")
	ctx := c.Request().Context()

	tracksToDownload, err := h.Spotify.GetPlaylistItems(ctx, id)
	if (err != nil) {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	err = h.YouTube.StreamPlaylistToZipParallel(ctx, c.Response().Writer, tracksToDownload)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return nil

}