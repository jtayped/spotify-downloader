/* Do not change, this code is generated from Golang structs */


export class Job {
    id: string;
    playlistId: string;
    type: string;
}
export class ProgressMessage {
    type: string;
    jobId: string;
    progress: number;
    message: string;
    payload?: any;
}
export class AlbumDTO {
    name: string;
    imageUrl: string;
    releaseDate: string;
}
export class ArtistDTO {
    name: string;
    id: string;
}
export class TrackDTO {
    id: string;
    name: string;
    artists: ArtistDTO[];
    album: AlbumDTO;
    durationMs: number;
    explicit: boolean;
    previewUrl: string;
    externalUrl: string;
    addedAt: string;
}
export class PlaylistMetadata {
    name: string;
    description: string;
    owner: string;
    imageUrl: string;
    externalUrl: string;
}
export class PlaylistResponse {
    metadata?: PlaylistMetadata;
    tracks: TrackDTO[];
    total: number;
}


export class TrackDetailsDTO {
    id: string;
    name: string;
    artists: ArtistDTO[];
    album: AlbumDTO;
    durationMs: number;
    explicit: boolean;
    previewUrl: string;
    externalUrl: string;
    popularity: number;
    trackNumber: number;
    discNumber: number;
    isrc: string;
}


export class YtDlpResult {
    id: string;
    title: string;
    duration: number;
    webpageUrl: string;
}