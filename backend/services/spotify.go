package services

import (
	"backend/models"
	"context"
	"fmt"
	"os"

	"github.com/zmb3/spotify/v2"
	spotifyauth "github.com/zmb3/spotify/v2/auth"
	"golang.org/x/oauth2/clientcredentials"
)

type SpotifyService struct {
	client *spotify.Client
}

func NewSpotifyService() (*SpotifyService, error) {
	// ... (Same auth code as before) ...
    ctx := context.Background()
	config := &clientcredentials.Config{
		ClientID:     os.Getenv("SPOTIFY_CLIENT_ID"),
		ClientSecret: os.Getenv("SPOTIFY_CLIENT_SECRET"),
		TokenURL:     spotifyauth.TokenURL,
	}
	token, err := config.Token(ctx)
    if err != nil {
        return nil, fmt.Errorf("error fetching spotify token")
    }
	httpClient := spotifyauth.New().Client(ctx, token)
	return &SpotifyService{client: spotify.New(httpClient)}, nil
}

// GetPlaylist handles both Initial load (offset 0) and Scrolling (offset > 0)
func (s *SpotifyService) GetPlaylist(ctx context.Context, playlistID string, offset, limit int) (*models.PlaylistResponse, error) {
	id := spotify.ID(playlistID)
	response := &models.PlaylistResponse{}

	if offset == 0 {
		// --- Initial Load (Metadata + Tracks) ---
		full, err := s.client.GetPlaylist(ctx, id, spotify.Limit(limit), spotify.Offset(0))
		if err != nil {
			return nil, err
		}

		// Map Metadata
		imgURL := ""
		if len(full.Images) > 0 {
			imgURL = full.Images[0].URL
		}
		
		response.Metadata = &models.PlaylistMetadata{
			Id:			 string(full.ID),
			Name:        full.Name,
			Description: full.Description,
			Owner:       full.Owner.DisplayName,
			ImageURL:    imgURL,
			ExternalURL: full.ExternalURLs["spotify"],
		}
		response.Total = int(full.Tracks.Total)
		
		// Convert Tracks
		tempItems := make([]spotify.PlaylistItem, len(full.Tracks.Tracks))
		for i := range full.Tracks.Tracks {
			src := &full.Tracks.Tracks[i]
			tempItems[i] = spotify.PlaylistItem{
				AddedAt: src.AddedAt,
				Track:   spotify.PlaylistItemTrack{Track: &src.Track},
			}
		}
		response.Tracks = mapTracksToDTO(tempItems)

	} else {
		// --- Scroll Load (Tracks Only) ---
		page, err := s.client.GetPlaylistItems(ctx, id, spotify.Limit(limit), spotify.Offset(offset))
		if err != nil {
			return nil, err
		}
		response.Total = int(page.Total)
		response.Tracks = mapTracksToDTO(page.Items)
	}

	return response, nil
}

// Private helper function - internal to the service
func mapTracksToDTO(items []spotify.PlaylistItem) []models.TrackDTO {
	dtos := make([]models.TrackDTO, 0, len(items))

	for _, item := range items {
		if item.Track.Track == nil { continue } // Skip podcasts
		
		track := item.Track.Track
		
		// Handle Images
		albumImg := ""
		if len(track.Album.Images) > 0 {
			albumImg = track.Album.Images[0].URL
		}

		// Handle Artists
		artists := make([]models.ArtistDTO, len(track.Artists))
		for i, a := range track.Artists {
			artists[i] = models.ArtistDTO{Name: a.Name, ID: a.ID.String()}
		}

		dtos = append(dtos, models.TrackDTO{
			ID:          track.ID.String(),
			Name:        track.Name,
			Artists:     artists,
			Album:       models.AlbumDTO{Name: track.Album.Name, ImageURL: albumImg},
			DurationMs:  int(track.Duration),
			Explicit:    track.Explicit,
			PreviewURL:  track.PreviewURL,
			ExternalURL: track.ExternalURLs["spotify"],
			AddedAt:     item.AddedAt,
		})
	}
	return dtos
}

// GetTrack fetches a single track and returns a detailed DTO
func (s *SpotifyService) GetTrack(ctx context.Context, trackID string) (*models.TrackDetailsDTO, error) {
	id := spotify.ID(trackID)
	
	// Call Spotify API
	fullTrack, err := s.client.GetTrack(ctx, id)
	if err != nil {
		return nil, err
	}

	// Extract Album Image
	albumImg := ""
	if len(fullTrack.Album.Images) > 0 {
		albumImg = fullTrack.Album.Images[0].URL
	}

	// Map Artists
	artists := make([]models.ArtistDTO, len(fullTrack.Artists))
	for i, a := range fullTrack.Artists {
		artists[i] = models.ArtistDTO{Name: a.Name, ID: a.ID.String()}
	}

	// Extract ISRC
	isrc := ""
	if val, ok := fullTrack.ExternalIDs["isrc"]; ok {
		isrc = val
	}

	return &models.TrackDetailsDTO{
		ID:          fullTrack.ID.String(),
		Name:        fullTrack.Name,
		Artists:     artists,
		Album: models.AlbumDTO{
			Name:        fullTrack.Album.Name,
			ImageURL:    albumImg,
			ReleaseDate: fullTrack.Album.ReleaseDate,
		},
		DurationMs:  int(fullTrack.Duration),
		Explicit:    fullTrack.Explicit,
		PreviewURL:  fullTrack.PreviewURL,
		ExternalURL: fullTrack.ExternalURLs["spotify"],
		
		// Detailed fields
		Popularity:  int(fullTrack.Popularity),
		TrackNumber: int(fullTrack.TrackNumber),
		DiscNumber:  int(fullTrack.DiscNumber),
		ISRC:        isrc,
	}, nil
}

// GetPlaylistItems retrieves ALL tracks in a playlist, handling pagination automatically.
func (s *SpotifyService) GetPlaylistItems(ctx context.Context, playlistID string) ([]models.TrackDTO, error) {
    id := spotify.ID(playlistID)
    var allTracks []spotify.PlaylistItem
    
    // 1. Initial request to get the first page and total count
    // We request 100 items (maximum allowed by Spotify API per request) to minimize round-trips
    limit := 100
    offset := 0

    for {
        // Check for cancellation (e.g. user closed browser)
        if ctx.Err() != nil {
            return nil, ctx.Err()
        }

        // Fetch page
        page, err := s.client.GetPlaylistItems(ctx, id, spotify.Limit(limit), spotify.Offset(offset))
        if err != nil {
            return nil, fmt.Errorf("failed to fetch playlist page at offset %d: %w", offset, err)
        }

        // Append items from this page
        allTracks = append(allTracks, page.Items...)

        // 2. Check if we are done
        // If the number of items fetched so far is >= total, stop.
        if len(allTracks) >= int(page.Total) {
            break
        }

        // If the page returned fewer items than requested, we are likely at the end
        if len(page.Items) == 0 {
            break
        }

        // Prepare for next page
        offset += len(page.Items)
    }

    // 3. Convert all raw Spotify items to your simplified DTOs using your existing helper
    return mapTracksToDTO(allTracks), nil
}