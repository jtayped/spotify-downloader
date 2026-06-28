package handlers

import (
	"backend/models"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

// GetPlaylist (GET /api/playlist/:id)
// For offset == 0: returns both metadata and the first page of tracks.
// For offset > 0: returns only the requested page of tracks (for infinite scroll).
func (h *Handler) GetPlaylist(c echo.Context) error {
	id := c.Param("id")
	ctx := c.Request().Context()

	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit == 0 {
		limit = 25
	}
	offset, _ := strconv.Atoi(c.QueryParam("offset"))

	response := &models.PlaylistResponse{}

	if offset == 0 {
		meta, err := h.Spotify.GetPlaylistMetadata(ctx, id)
		if err != nil {
			c.Logger().Errorf("GetPlaylist[%s] metadata: %v", id, err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		tracks, total, err := h.Spotify.GetPlaylistTracks(ctx, id, 0, limit)
		if err != nil {
			c.Logger().Errorf("GetPlaylist[%s] tracks: %v", id, err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		response.Metadata = &meta
		response.Tracks = tracks
		response.Total = total
	} else {
		tracks, total, err := h.Spotify.GetPlaylistTracks(ctx, id, offset, limit)
		if err != nil {
			c.Logger().Errorf("GetPlaylist[%s] tracks offset=%d: %v", id, offset, err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		response.Tracks = tracks
		response.Total = total
	}

	return c.JSON(http.StatusOK, response)
}
