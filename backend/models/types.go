package models

// --- Queue & WebSocket Models ---

type Job struct {
	ID         string `json:"id"`
	PlaylistID string `json:"playlist_id"`
	Type       string `json:"type"` // "playlist" or "track"
}

type ProgressMessage struct {
	Type     string `json:"type"`     // "progress", "complete", "error"
	JobID    string `json:"job_id"`
	Progress float64 `json:"progress"` // 0-100
	Message  string `json:"message"`
	Payload  any    `json:"payload,omitempty"`
}

// --- Spotify Models ---

type PlaylistResponse struct {
	Metadata *PlaylistMetadata `json:"metadata"`
	Tracks   []TrackDTO        `json:"tracks"`
	Total    int               `json:"total"`
}

type PlaylistMetadata struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Owner       string `json:"owner"`
	ImageURL    string `json:"image_url"`
	ExternalURL string `json:"external_url"`
}

type TrackDTO struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Artists     []ArtistDTO `json:"artists"`
	Album       AlbumDTO    `json:"album"`
	DurationMs  int         `json:"duration_ms"`
	Explicit    bool        `json:"explicit"`
	PreviewURL  string      `json:"preview_url"`
	ExternalURL string      `json:"external_url"`
	AddedAt     string      `json:"added_at"`
}

type TrackDetailsDTO struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Artists     []ArtistDTO `json:"artists"`
	Album       AlbumDTO    `json:"album"`
	DurationMs  int         `json:"duration_ms"`
	Explicit    bool        `json:"explicit"`
	PreviewURL  string      `json:"preview_url"`
	ExternalURL string      `json:"external_url"`
	Popularity  int         `json:"popularity"`
	TrackNumber int         `json:"track_number"`
	DiscNumber  int         `json:"disc_number"`
	ISRC        string      `json:"isrc"`
}

type ArtistDTO struct {
	Name string `json:"name"`
	ID   string `json:"id"`
}

type AlbumDTO struct {
	Name        string `json:"name"`
	ImageURL    string `json:"image_url"`
	ReleaseDate string `json:"release_date"`
}

// --- YouTube Models ---

// YtDlpResult represents the JSON output from yt-dlp
// Moved here from youtube.go
type YtDlpResult struct {
	ID       string  `json:"id"`
	Title    string  `json:"title"`
	Duration float64 `json:"duration"`
	Webpage  string  `json:"webpage_url"`
}