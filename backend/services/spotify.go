package services

import (
	"backend/models"
	"context"
	"fmt"

	"github.com/zmb3/spotify/v2"
	spotifyauth "github.com/zmb3/spotify/v2/auth"
	"golang.org/x/oauth2/clientcredentials"
)

type SpotifyService struct {
	client *spotify.Client
}

func NewSpotifyService(ctx context.Context, clientID, clientSecret string) (*SpotifyService, error) {
	config := &clientcredentials.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		TokenURL:     spotifyauth.TokenURL,
	}
	token, err := config.Token(ctx)
	if err != nil {
		return nil, fmt.Errorf("spotify: authenticate: %w", err)
	}
	httpClient := spotifyauth.New().Client(ctx, token)
	return &SpotifyService{client: spotify.New(httpClient)}, nil
}

// GetPlaylistMetadata returns only playlist metadata (name, description, owner, images, total tracks).
func (s *SpotifyService) GetPlaylistMetadata(ctx context.Context, playlistID string) (models.PlaylistMetadata, error) {
	id := spotify.ID(playlistID)
	full, err := s.client.GetPlaylist(ctx, id, spotify.Limit(1), spotify.Offset(0))
	if err != nil {
		return models.PlaylistMetadata{}, fmt.Errorf("spotify: get playlist metadata: %w", err)
	}

	imgURL := ""
	if len(full.Images) > 0 {
		imgURL = full.Images[0].URL
	}

	return models.PlaylistMetadata{
		Id:          string(full.ID),
		Name:        full.Name,
		Description: full.Description,
		Owner:       full.Owner.DisplayName,
		ImageURL:    imgURL,
		ExternalURL: full.ExternalURLs["spotify"],
	}, nil
}

// GetPlaylistTracks returns a page of tracks for a playlist along with the total track count.
func (s *SpotifyService) GetPlaylistTracks(ctx context.Context, playlistID string, offset, limit int) ([]models.TrackDTO, int, error) {
	id := spotify.ID(playlistID)
	page, err := s.client.GetPlaylistItems(ctx, id, spotify.Limit(limit), spotify.Offset(offset))
	if err != nil {
		return nil, 0, fmt.Errorf("spotify: get playlist tracks: %w", err)
	}
	return mapTracksToDTO(page.Items), int(page.Total), nil
}

// GetTrack fetches a single track and returns a detailed DTO.
func (s *SpotifyService) GetTrack(ctx context.Context, trackID string) (*models.TrackDetailsDTO, error) {
	id := spotify.ID(trackID)

	fullTrack, err := s.client.GetTrack(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("spotify: get track: %w", err)
	}

	albumImg := ""
	if len(fullTrack.Album.Images) > 0 {
		albumImg = fullTrack.Album.Images[0].URL
	}

	artists := make([]models.ArtistDTO, len(fullTrack.Artists))
	for i, a := range fullTrack.Artists {
		artists[i] = models.ArtistDTO{Name: a.Name, ID: a.ID.String()}
	}

	isrc := ""
	if val, ok := fullTrack.ExternalIDs["isrc"]; ok {
		isrc = val
	}

	return &models.TrackDetailsDTO{
		ID:      fullTrack.ID.String(),
		Name:    fullTrack.Name,
		Artists: artists,
		Album: models.AlbumDTO{
			Name:        fullTrack.Album.Name,
			ImageURL:    albumImg,
			ReleaseDate: fullTrack.Album.ReleaseDate,
		},
		DurationMs:  int(fullTrack.Duration),
		Explicit:    fullTrack.Explicit,
		PreviewURL:  fullTrack.PreviewURL,
		ExternalURL: fullTrack.ExternalURLs["spotify"],
		Popularity:  int(fullTrack.Popularity),
		TrackNumber: int(fullTrack.TrackNumber),
		DiscNumber:  int(fullTrack.DiscNumber),
		ISRC:        isrc,
	}, nil
}

// GetPlaylistItems retrieves ALL tracks in a playlist, handling pagination automatically.
// Used by the orchestrator for bulk downloads.
func (s *SpotifyService) GetPlaylistItems(ctx context.Context, playlistID string) ([]models.TrackDTO, error) {
	id := spotify.ID(playlistID)
	var allTracks []spotify.PlaylistItem

	limit := 100
	offset := 0

	for {
		if ctx.Err() != nil {
			return nil, ctx.Err()
		}

		page, err := s.client.GetPlaylistItems(ctx, id, spotify.Limit(limit), spotify.Offset(offset))
		if err != nil {
			return nil, fmt.Errorf("spotify: fetch playlist page at offset %d: %w", offset, err)
		}

		allTracks = append(allTracks, page.Items...)

		if len(allTracks) >= int(page.Total) {
			break
		}
		if len(page.Items) == 0 {
			break
		}

		offset += len(page.Items)
	}

	return mapTracksToDTO(allTracks), nil
}

// GetAlbumMetadata returns album metadata (name, artists, images, release date, total tracks).
func (s *SpotifyService) GetAlbumMetadata(ctx context.Context, albumID string) (models.AlbumMetadata, error) {
	id := spotify.ID(albumID)
	album, err := s.client.GetAlbum(ctx, id)
	if err != nil {
		return models.AlbumMetadata{}, fmt.Errorf("spotify: get album metadata: %w", err)
	}

	imgURL := ""
	if len(album.Images) > 0 {
		imgURL = album.Images[0].URL
	}

	artists := make([]models.ArtistDTO, len(album.Artists))
	for i, a := range album.Artists {
		artists[i] = models.ArtistDTO{Name: a.Name, ID: a.ID.String()}
	}

	return models.AlbumMetadata{
		ID:          album.ID.String(),
		Name:        album.Name,
		Artists:     artists,
		ImageURL:    imgURL,
		ReleaseDate: album.ReleaseDate,
		TotalTracks: int(album.Tracks.Total),
		ExternalURL: album.ExternalURLs["spotify"],
	}, nil
}

// GetAlbumTracksPaged returns a page of tracks for an album along with the total track count.
func (s *SpotifyService) GetAlbumTracksPaged(ctx context.Context, albumID string, offset, limit int) ([]models.TrackDTO, int, error) {
	id := spotify.ID(albumID)

	album, err := s.client.GetAlbum(ctx, id)
	if err != nil {
		return nil, 0, fmt.Errorf("spotify: get album for tracks: %w", err)
	}

	imgURL := ""
	if len(album.Images) > 0 {
		imgURL = album.Images[0].URL
	}
	albumDTO := models.AlbumDTO{
		Name:        album.Name,
		ImageURL:    imgURL,
		ReleaseDate: album.ReleaseDate,
	}

	page, err := s.client.GetAlbumTracks(ctx, id, spotify.Limit(limit), spotify.Offset(offset))
	if err != nil {
		return nil, 0, fmt.Errorf("spotify: get album tracks: %w", err)
	}

	dtos := make([]models.TrackDTO, 0, len(page.Tracks))
	for _, track := range page.Tracks {
		artists := make([]models.ArtistDTO, len(track.Artists))
		for i, a := range track.Artists {
			artists[i] = models.ArtistDTO{Name: a.Name, ID: a.ID.String()}
		}
		dtos = append(dtos, models.TrackDTO{
			ID:          track.ID.String(),
			Name:        track.Name,
			Artists:     artists,
			Album:       albumDTO,
			DurationMs:  int(track.Duration),
			Explicit:    track.Explicit,
			PreviewURL:  track.PreviewURL,
			ExternalURL: track.ExternalURLs["spotify"],
			TrackNumber: int(track.TrackNumber),
			DiscNumber:  int(track.DiscNumber),
		})
	}

	return dtos, int(page.Total), nil
}

// GetAlbumItems retrieves ALL tracks in an album, handling pagination automatically.
// Used by the orchestrator for bulk downloads.
func (s *SpotifyService) GetAlbumItems(ctx context.Context, albumID string) ([]models.TrackDTO, error) {
	id := spotify.ID(albumID)

	album, err := s.client.GetAlbum(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("spotify: get album: %w", err)
	}

	imgURL := ""
	if len(album.Images) > 0 {
		imgURL = album.Images[0].URL
	}
	albumDTO := models.AlbumDTO{
		Name:        album.Name,
		ImageURL:    imgURL,
		ReleaseDate: album.ReleaseDate,
	}

	var allTracks []models.TrackDTO
	limit := 50
	offset := 0

	for {
		if ctx.Err() != nil {
			return nil, ctx.Err()
		}

		page, err := s.client.GetAlbumTracks(ctx, id, spotify.Limit(limit), spotify.Offset(offset))
		if err != nil {
			return nil, fmt.Errorf("spotify: get album tracks at offset %d: %w", offset, err)
		}

		for _, track := range page.Tracks {
			artists := make([]models.ArtistDTO, len(track.Artists))
			for i, a := range track.Artists {
				artists[i] = models.ArtistDTO{Name: a.Name, ID: a.ID.String()}
			}
			allTracks = append(allTracks, models.TrackDTO{
				ID:          track.ID.String(),
				Name:        track.Name,
				Artists:     artists,
				Album:       albumDTO,
				DurationMs:  int(track.Duration),
				Explicit:    track.Explicit,
				PreviewURL:  track.PreviewURL,
				ExternalURL: track.ExternalURLs["spotify"],
				TrackNumber: int(track.TrackNumber),
				DiscNumber:  int(track.DiscNumber),
			})
		}

		if len(allTracks) >= int(page.Total) || len(page.Tracks) == 0 {
			break
		}
		offset += len(page.Tracks)
	}

	return allTracks, nil
}

// mapTracksToDTO converts Spotify playlist items to TrackDTOs, skipping podcasts.
func mapTracksToDTO(items []spotify.PlaylistItem) []models.TrackDTO {
	dtos := make([]models.TrackDTO, 0, len(items))

	for _, item := range items {
		if item.Track.Track == nil {
			continue // Skip podcasts/local files
		}

		track := item.Track.Track

		albumImg := ""
		if len(track.Album.Images) > 0 {
			albumImg = track.Album.Images[0].URL
		}

		artists := make([]models.ArtistDTO, len(track.Artists))
		for i, a := range track.Artists {
			artists[i] = models.ArtistDTO{Name: a.Name, ID: a.ID.String()}
		}

		dtos = append(dtos, models.TrackDTO{
			ID:      track.ID.String(),
			Name:    track.Name,
			Artists: artists,
			Album: models.AlbumDTO{
				Name:        track.Album.Name,
				ImageURL:    albumImg,
				ReleaseDate: track.Album.ReleaseDate,
			},
			DurationMs:  int(track.Duration),
			Explicit:    track.Explicit,
			PreviewURL:  track.PreviewURL,
			ExternalURL: track.ExternalURLs["spotify"],
			AddedAt:     item.AddedAt,
			TrackNumber: int(track.TrackNumber),
			DiscNumber:  int(track.DiscNumber),
		})
	}
	return dtos
}
