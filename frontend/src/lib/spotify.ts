import type { DownloadType } from "./download-api";

export const SPOTIFY_TYPES: DownloadType[] = ["track", "playlist", "album"];

export interface ParsedSpotifyRef {
  type: DownloadType;
  id: string;
}

/**
 * Accepts anything a user can realistically paste: a full share URL, a
 * locale-prefixed one (`open.spotify.com/intl-es/album/<id>`), a URL carrying
 * `?si=` tracking params, or a bare `spotify:album:<id>` URI.
 */
export function parseSpotifyRef(input: string): ParsedSpotifyRef | null {
  const value = input.trim();
  if (!value) return null;

  // spotify:album:37i9dQ...
  const uriMatch = /^spotify:(track|playlist|album):([A-Za-z0-9]+)$/.exec(value);
  if (uriMatch?.[1] && uriMatch[2]) {
    return { type: uriMatch[1] as DownloadType, id: uriMatch[2] };
  }

  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    if (!/(^|\.)spotify\.com$/.test(url.hostname)) return null;

    const segments = url.pathname.split("/").filter(Boolean);
    // Spotify prefixes copied links with a locale in some regions, so find the
    // type segment rather than assuming it comes first.
    const typeIndex = segments.findIndex((segment) =>
      SPOTIFY_TYPES.includes(segment as DownloadType),
    );
    if (typeIndex === -1) return null;

    const type = segments[typeIndex] as DownloadType;
    const id = segments[typeIndex + 1];
    if (!id) return null;

    return { type, id: id.split("?")[0]! };
  } catch {
    return null;
  }
}

export const TYPE_LABEL: Record<DownloadType, string> = {
  track: "track",
  album: "album",
  playlist: "playlist",
};
