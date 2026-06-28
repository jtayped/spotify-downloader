package handlers

import (
	"backend/internal/queue"
	"backend/internal/ws"
	"backend/models"
	"backend/services"
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
)

// Handler holds all service dependencies injected at startup.
type Handler struct {
	Spotify *services.SpotifyService
	YouTube *services.YouTubeService
	Queue   *queue.Queue
	Hub     *ws.Hub
}

// NewHandler constructs a Handler with the given dependencies.
func NewHandler(spotify *services.SpotifyService, youtube *services.YouTubeService, q *queue.Queue, hub *ws.Hub) *Handler {
	return &Handler{
		Spotify: spotify,
		YouTube: youtube,
		Queue:   q,
		Hub:     hub,
	}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// --- Asynchronous / Queue Handlers ---

// StartPlaylistDownload (POST /api/playlist/:id/download)
// Enqueues a playlist download job and returns the job ID and WebSocket URL.
func (h *Handler) StartPlaylistDownload(c echo.Context) error {
	id := c.Param("id")
	jobID := uuid.New().String()

	h.Queue.AddJob(models.Job{
		ID:     jobID,
		ItemID: id,
		Type:   models.JobTypePlaylist,
	})

	return c.JSON(http.StatusAccepted, models.DownloadJobResponse{
		JobID: jobID,
		WsURL: "/api/ws?job_id=" + jobID,
	})
}

// StartAlbumDownload (POST /api/album/:id/download)
// Enqueues an album download job and returns the job ID and WebSocket URL.
func (h *Handler) StartAlbumDownload(c echo.Context) error {
	id := c.Param("id")
	jobID := uuid.New().String()

	h.Queue.AddJob(models.Job{
		ID:     jobID,
		ItemID: id,
		Type:   models.JobTypeAlbum,
	})

	return c.JSON(http.StatusAccepted, models.DownloadJobResponse{
		JobID: jobID,
		WsURL: "/api/ws?job_id=" + jobID,
	})
}

// HandleWebSocket (GET /api/ws)
// Upgrades the connection and subscribes it to the given job's progress stream.
func (h *Handler) HandleWebSocket(c echo.Context) error {
	jobID := c.QueryParam("job_id")
	if jobID == "" {
		return c.String(http.StatusBadRequest, "Missing job_id")
	}

	wsConn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return fmt.Errorf("handlers: websocket upgrade: %w", err)
	}

	h.Hub.Register(jobID, wsConn)
	return nil
}

// ServeDownloadFile (GET /api/download/:jobId)
// Serves the final ZIP file produced by the download worker.
func (h *Handler) ServeDownloadFile(c echo.Context) error {
	jobID := c.Param("jobId")
	filePath := fmt.Sprintf("./tmp/%s.zip", jobID)
	return c.File(filePath)
}
