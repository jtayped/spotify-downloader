package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"strconv"

	"backend/handlers"
	"backend/internal/queue"
	"backend/internal/ws"
	"backend/services"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

// envInt reads a positive int from the environment, falling back to def if the
// var is unset, unparsable, or not positive (e.g. 0 would make a semaphore or
// worker pool built from it deadlock outright).
func envInt(key string, def int) int {
	val := os.Getenv(key)
	if val == "" {
		return def
	}
	n, err := strconv.Atoi(val)
	if err != nil || n < 1 {
		log.Printf("Warning: %s=%q is invalid, falling back to %d", key, val, def)
		return def
	}
	return n
}

func main() {
	log.SetFlags(log.Ltime)

	if err := godotenv.Load("../.env"); err != nil {
		log.Println("Info: No .env file found, relying on system environment variables")
	}

	ctx := context.Background()

	// 1. Initialise services
	spotifySvc, err := services.NewSpotifyService(ctx, os.Getenv("SPOTIFY_CLIENT_ID"), os.Getenv("SPOTIFY_CLIENT_SECRET"))
	if err != nil {
		log.Fatal("Failed to init Spotify:", err)
	}

	youtubeSvc := services.NewYouTubeService()

	// 2. Initialise orchestrator (worker logic)
	maxConcurrentDownloads := envInt("MAX_CONCURRENT_DOWNLOADS", 5)
	orchestrator := services.NewOrchestrator(spotifySvc, youtubeSvc, maxConcurrentDownloads)

	// 3. Initialise async components
	maxConcurrentJobs := envInt("MAX_CONCURRENT_JOBS", 5)
	log.Printf("Config: max %d concurrent track downloads, max %d concurrent jobs", maxConcurrentDownloads, maxConcurrentJobs)

	hub := ws.NewHub()
	q := queue.NewQueue(hub, orchestrator, 100)
	q.StartWorkers(maxConcurrentJobs)

	// 4. Initialise handler with all dependencies
	h := handlers.NewHandler(spotifySvc, youtubeSvc, q, hub)

	// 5. Setup server & routes
	e := echo.New()
	e.HideBanner = true
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			err := next(c)
			if c.Path() == "/api/health" {
				return err
			}
			if err != nil {
				code := http.StatusInternalServerError
				var he *echo.HTTPError
				if errors.As(err, &he) {
					code = he.Code
				}
				log.Printf("ERR %d | %s %s | %v", code, c.Request().Method, c.Request().RequestURI, err)
			} else if status := c.Response().Status; status >= 400 {
				log.Printf("ERR %d | %s %s", status, c.Request().Method, c.Request().RequestURI)
			}
			return err
		}
	})
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"*"},
	}))

	// Health check
	e.GET("/api/health", func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	// Standard routes
	e.GET("/api/playlist/:id", h.GetPlaylist)
	e.GET("/api/album/:id", h.GetAlbum)
	e.GET("/api/track/:id", h.GetTrackDetails)
	e.GET("/api/track/:id/video", h.GetTrackVideo)
	e.GET("/api/track/:id/download", h.DownloadTrackAudio)

	// Async/queue routes
	e.POST("/api/playlist/:id/download", h.StartPlaylistDownload)
	e.POST("/api/album/:id/download", h.StartAlbumDownload)
	e.POST("/api/track/:id/download", h.StartTrackDownload)
	e.GET("/api/ws", h.HandleWebSocket)
	e.GET("/api/download/:jobId", h.ServeDownloadFile)

	e.Logger.Fatal(e.Start(":1323"))
}
