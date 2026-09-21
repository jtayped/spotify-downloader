"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { DownloadButton } from "@/components/downloads/download-button";
import { PlayButton } from "@/components/player/play-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CoverArt } from "@/components/ui/cover-art";
import { useRecent } from "@/hooks/use-recent";
import {
  formatDuration,
  formatReleaseDate,
  joinArtists,
} from "@/lib/utils";
import type { TrackDetailsDTO } from "@/types/api";

function DetailRow({
  term,
  children,
}: {
  term: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-line/70 grid grid-cols-[7.5rem_1fr] gap-4 border-b py-2.5 last:border-b-0">
      <dt className="text-ink-subtle text-[12px]">{term}</dt>
      <dd className="text-ink min-w-0 text-[13px]">{children}</dd>
    </div>
  );
}

function TrackView({ track }: { track: TrackDetailsDTO }) {
  const artists = joinArtists(track.artists);
  const { remember } = useRecent();

  React.useEffect(() => {
    remember({
      type: "track",
      id: track.id,
      name: track.name,
      subtitle: artists || "track",
      imageUrl: track.album?.imageUrl,
    });
  }, [track.id, track.name, artists, track.album?.imageUrl, remember]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-14">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
        <CoverArt
          src={track.album?.imageUrl}
          alt={`cover art for ${track.album?.name ?? track.name}`}
          priority
          rounded="rounded-xl"
          className="shadow-art size-44 sm:size-52"
        />

        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            <h1 className="text-ink text-3xl leading-[1.1] font-semibold tracking-[-0.025em] text-balance sm:text-[2.5rem]">
              {track.name}
            </h1>
            <p className="text-ink text-[15px] font-medium">{artists}</p>
            <p className="text-ink-muted flex flex-wrap items-center gap-2 text-[13px]">
              {track.album?.id ? (
                <Link
                  href={`/album/${track.album.id}`}
                  className="hover:text-ink underline-offset-4 hover:underline"
                >
                  {track.album.name}
                </Link>
              ) : (
                <span>{track.album?.name}</span>
              )}
              <span className="text-ink-subtle" aria-hidden>
                ·
              </span>
              <span className="tabular font-mono text-[12px]">
                {formatDuration(track.durationMs)}
              </span>
              {track.explicit && <Badge variant="outline">explicit</Badge>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <DownloadButton
              type="track"
              id={track.id}
              name={track.name}
              imageUrl={track.album?.imageUrl}
            />
            <PlayButton track={track} size="lg" />
            {track.externalUrl && (
              <Button variant="ghost" size="lg" asChild>
                <a
                  href={track.externalUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  open in spotify
                  <ExternalLink />
                </a>
              </Button>
            )}
          </div>
        </div>
      </header>

      <section className="mt-12" aria-labelledby="track-details">
        <h2
          id="track-details"
          className="text-ink mb-1 text-[15px] font-semibold"
        >
          details
        </h2>
        <p className="text-ink-muted mb-4 text-[12px]">
          everything spotify returns for this recording.
        </p>

        <dl className="border-line bg-canvas rounded-xl border px-4 py-1">
          <DetailRow term="album">
            {track.album?.id ? (
              <Link
                href={`/album/${track.album.id}`}
                className="hover:text-accent-text underline-offset-4 hover:underline"
              >
                {track.album.name}
              </Link>
            ) : (
              (track.album?.name ?? "not supplied")
            )}
          </DetailRow>

          <DetailRow term="released">
            <span className="tabular">
              {formatReleaseDate(track.album?.releaseDate ?? "") || "not supplied"}
            </span>
          </DetailRow>

          <DetailRow term="position">
            <span className="tabular font-mono text-[12px]">
              track {track.trackNumber || "?"}
              {track.discNumber > 1 && ` · disc ${track.discNumber}`}
              {track.album?.totalTracks
                ? ` of ${track.album.totalTracks}`
                : ""}
            </span>
          </DetailRow>

          <DetailRow term="duration">
            <span className="tabular font-mono text-[12px]">
              {formatDuration(track.durationMs)}
            </span>
          </DetailRow>

          <DetailRow term="isrc">
            {track.isrc ? (
              <span className="tabular font-mono text-[12px]">{track.isrc}</span>
            ) : (
              <span className="text-ink-subtle">not supplied</span>
            )}
          </DetailRow>

          <DetailRow term="popularity">
            <span className="flex items-center gap-3">
              <span className="bg-raised h-1.5 w-28 overflow-hidden rounded-full">
                <span
                  className="bg-accent block h-full rounded-full"
                  style={{ width: `${Math.max(0, Math.min(100, track.popularity))}%` }}
                />
              </span>
              <span className="text-ink-muted tabular font-mono text-[12px]">
                {track.popularity}/100
              </span>
            </span>
          </DetailRow>

          {track.album?.label && (
            <DetailRow term="label">{track.album.label}</DetailRow>
          )}

          {track.album?.copyright && (
            <DetailRow term="copyright">
              <span className="text-ink-muted text-[12px] leading-relaxed">
                {track.album.copyright}
              </span>
            </DetailRow>
          )}
        </dl>
      </section>
    </div>
  );
}

export { TrackView };
