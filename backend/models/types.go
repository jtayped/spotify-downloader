package models

// --- Custom Enum Types ---

type JobType string

const (
	JobTypePlaylist JobType = "playlist"
	JobTypeTrack    JobType = "track"
	JobTypeAlbum    JobType = "album"
)

type ProgressType string

const (
	ProgressTypeProgress ProgressType = "progress"
	ProgressTypeComplete ProgressType = "complete"
	ProgressTypeError    ProgressType = "error"
)

// --- Queue & WebSocket Models ---

type Job struct {
	ID     string  `json:"id"`
	ItemID string  `json:"itemId"`
	Type   JobType `json:"type" tstype:"'playlist' | 'track' | 'album'"`
}

type ProgressMessage struct {
	Type     ProgressType `json:"type" tstype:"'progress' | 'complete' | 'error'"`
	JobID    string       `json:"jobId"`
	Progress float64      `json:"progress"` // 0-100
	Message  string       `json:"message"`
	Payload  any          `json:"payload,omitempty" tstype:"unknown"`
}

type DownloadJobResponse struct {
    JobID string `json:"job_id"`
    WsURL string `json:"ws_url"`
}

// --- Spotify Models ---

type PlaylistResponse struct {
	Metadata *PlaylistMetadata `json:"metadata"`
	Tracks   []TrackDTO        `json:"tracks"`
	Total    int               `json:"total"`
}

type PlaylistMetadata struct {
	Id			string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Owner       string `json:"owner"`
	ImageURL    string `json:"imageUrl"`
	ExternalURL string `json:"externalUrl"`
}

type TrackDTO struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Artists     []ArtistDTO `json:"artists"`
	Album       AlbumDTO    `json:"album"`
	DurationMs  int         `json:"durationMs"`
	Explicit    bool        `json:"explicit"`
	PreviewURL  string      `json:"previewUrl"`
	ExternalURL string      `json:"externalUrl"`
	AddedAt     string      `json:"addedAt"`
	TrackNumber int         `json:"trackNumber"`
	DiscNumber  int         `json:"discNumber"`
}

type TrackDetailsDTO struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Artists     []ArtistDTO `json:"artists"`
	Album       AlbumDTO    `json:"album"`
	DurationMs  int         `json:"durationMs"`
	Explicit    bool        `json:"explicit"`
	PreviewURL  string      `json:"previewUrl"`
	ExternalURL string      `json:"externalUrl"`
	Popularity  int         `json:"popularity"`
	TrackNumber int         `json:"trackNumber"`
	DiscNumber  int         `json:"discNumber"`
	ISRC        string      `json:"isrc"`
}

type ArtistDTO struct {
	Name string `json:"name"`
	ID   string `json:"id"`
}

type AlbumDTO struct {
	Name        string `json:"name"`
	ImageURL    string `json:"imageUrl"`
	ReleaseDate string `json:"releaseDate"`
}

// --- Album Models ---

type AlbumMetadata struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Artists     []ArtistDTO `json:"artists"`
	ImageURL    string      `json:"imageUrl"`
	ReleaseDate string      `json:"releaseDate"`
	TotalTracks int         `json:"totalTracks"`
	ExternalURL string      `json:"externalUrl"`
}

type AlbumResponse struct {
	Metadata *AlbumMetadata `json:"metadata"`
	Tracks   []TrackDTO     `json:"tracks"`
	Total    int            `json:"total"`
}

// --- YouTube Models ---

// YtDlpResult represents the JSON output from yt-dlp
// Moved here from youtube.go
type YtDlpResult struct {
	ID       string  `json:"id"`
	Title    string  `json:"title"`
	Duration float64 `json:"duration"`
	Webpage  string  `json:"webpageUrl"`
}