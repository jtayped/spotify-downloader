package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"

	"backend/handlers"
	"backend/internal/queue"
	"backend/internal/ws"
	"backend/services"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
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
	orchestrator := services.NewOrchestrator(spotifySvc, youtubeSvc)

	// 3. Initialise async components
	hub := ws.NewHub()
	q := queue.NewQueue(hub, orchestrator, 100)
	q.StartWorkers(2)

	// 4. Initialise handler with all dependencies
	h := handlers.NewHandler(spotifySvc, youtubeSvc, q, hub)

	// 5. Setup server & routes
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.HTTPErrorHandler = func(err error, c echo.Context) {
		code := http.StatusInternalServerError
		var he *echo.HTTPError
		if errors.As(err, &he) {
			code = he.Code
		}
		if code >= 500 {
			c.Logger().Errorf("[%s %s] %d: %v", c.Request().Method, c.Request().URL.Path, code, err)
		} else {
			c.Logger().Warnf("[%s %s] %d: %v", c.Request().Method, c.Request().URL.Path, code, err)
		}
		e.DefaultHTTPErrorHandler(err, c)
	}
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
	e.GET("/api/track/:id", h.GetTrackDetails)
	e.GET("/api/track/:id/video", h.GetTrackVideo)
	e.GET("/api/track/:id/download", h.DownloadTrackAudio)

	// Async/queue routes
	e.POST("/api/playlist/:id/download", h.StartPlaylistDownload)
	e.GET("/api/ws", h.HandleWebSocket)
	e.GET("/api/download/:jobId", h.ServeDownloadFile)

	e.Logger.Fatal(e.Start(":1323"))
}
