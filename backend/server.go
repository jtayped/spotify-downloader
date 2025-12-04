package main

import (
	"log"

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

	// 1. Initialize Services
	spotifySvc, err := services.NewSpotifyService()
	if err != nil {
		log.Fatal("Failed to init Spotify:", err)
	}

	youtubeSvc, err := services.NewYouTubeService()
	if err != nil {
		log.Fatal("Failed to init YouTube:", err)
	}

	// 2. Initialize Orchestrator (Worker Logic)
	orchestrator := &services.Orchestrator{
		Spotify: spotifySvc,
		YouTube: youtubeSvc,
	}

	// 3. Initialize Async Components
	hub := ws.NewHub()
	q := queue.NewQueue(hub, orchestrator)
	q.StartWorkers(2) // Start 2 background workers

	// 4. Initialize Handler with all dependencies
	h := &handlers.Handler{
		Spotify: spotifySvc,
		YouTube: youtubeSvc,
		Queue:   q,
		Hub:     hub,
	}

	// 5. Setup Server & Routes
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	// Standard Routes
	e.GET("/playlist/:id", h.GetPlaylist)
	e.GET("/track/:id", h.GetTrackDetails)
	e.GET("/track/:id/video", h.GetTrackVideo)
	e.GET("/track/:id/download", h.DownloadTrackAudio) // Direct stream (single track)

	// Async/Queue Routes
	e.POST("/playlist/:id/download", h.StartPlaylistDownload) // Start Job
	e.GET("/ws", h.HandleWebSocket)                           // Listen for progress
	e.GET("/download/:jobId", h.ServeDownloadFile)            // Download result

	e.Logger.Fatal(e.Start(":1323"))
}