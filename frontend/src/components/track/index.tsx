import type { TrackDetailsDTO } from "@/types/api";
import Image from "next/image";
import { ExternalLink, Music } from "lucide-react";
import { formatDuration } from "@/lib/utils";

const TrackView = ({ track }: { track: TrackDetailsDTO }) => {
  const releaseYear = track.album.releaseDate?.split("-")[0] ?? "";

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-12">
      <div className="flex w-full max-w-2xl flex-col items-center gap-8 sm:flex-row sm:items-start">
        {/* Album Art */}
        <div className="relative h-56 w-56 shrink-0 overflow-hidden rounded-xl shadow-2xl sm:h-64 sm:w-64">
          {track.album.imageUrl ? (
            <Image
              src={track.album.imageUrl}
              alt={track.album.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 224px, 256px"
              priority
            />
          ) : (
            <div className="bg-muted flex h-full w-full items-center justify-center">
              <Music className="text-muted-foreground h-16 w-16" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-3 text-center sm:text-left">
          <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
            Track {track.trackNumber}
          </span>

          <h1 className="text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
            {track.name}
          </h1>

          {/* Artists — each links to their Spotify profile */}
          <p className="text-muted-foreground text-base">
            {track.artists.map((artist, i) => (
              <span key={artist.id}>
                {i > 0 && <span className="mr-1">,</span>}
                <a
                  href={`https://open.spotify.com/artist/${artist.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors hover:underline"
                >
                  {artist.name}
                </a>
              </span>
            ))}
          </p>

          {/* Album name + release year */}
          <p className="text-muted-foreground text-sm">
            {track.album.name}
            {releaseYear && (
              <span className="text-muted-foreground/60 ml-2">· {releaseYear}</span>
            )}
          </p>

          {/* Duration */}
          <p className="text-muted-foreground font-mono text-sm tabular-nums">
            {formatDuration(track.durationMs)}
          </p>

          {/* Open in Spotify */}
          {track.externalUrl && (
            <a
              href={track.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border hover:bg-muted mt-2 inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in Spotify
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackView;
