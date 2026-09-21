"use client";

import * as React from "react";
import Link from "next/link";

import { PlayButton } from "@/components/player/play-button";
import { Badge } from "@/components/ui/badge";
import { CoverArt } from "@/components/ui/cover-art";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { usePreviewPlayer } from "@/hooks/use-preview-player";
import { cn, formatDate, formatDuration } from "@/lib/utils";
import type { TrackDTO } from "@/types/api";

type Kind = "playlist" | "album";

function ArtistLinks({ artists }: { artists: TrackDTO["artists"] }) {
  return (
    <>
      {artists.map((artist, index) => (
        <span key={`${artist.id}-${index}`}>
          {index > 0 && ", "}
          {artist.name}
        </span>
      ))}
    </>
  );
}

function TrackRow({
  track,
  index,
  kind,
}: {
  track: TrackDTO;
  index: number;
  kind: Kind;
}) {
  const { current } = usePreviewPlayer();
  const isCurrent = current?.id === track.id;
  const position = kind === "album" ? (track.trackNumber || index + 1) : index + 1;

  return (
    <tr
      className={cn(
        "group/row border-line/60 border-b transition-colors duration-100",
        isCurrent ? "bg-accent-wash" : "hover:bg-surface",
      )}
    >
      <td className="w-12 py-2.5 pl-3 align-middle sm:pl-4">
        <span
          className={cn(
            "text-ink-subtle tabular block text-center font-mono text-[12px]",
            "group-hover/row:hidden group-focus-within/row:hidden",
            isCurrent && "hidden",
          )}
        >
          {position}
        </span>
        <span
          className={cn(
            "hidden justify-center group-hover/row:flex group-focus-within/row:flex",
            isCurrent && "flex",
          )}
        >
          <PlayButton track={track} size="sm" />
        </span>
      </td>

      <td className="min-w-0 py-2.5 pr-3 align-middle">
        <div className="flex min-w-0 items-center gap-3">
          {kind === "playlist" && (
            <CoverArt
              src={track.album?.imageUrl}
              alt=""
              className="size-10"
              rounded="rounded-sm"
            />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/track/${track.id}`}
                className={cn(
                  "truncate text-[13px] font-medium",
                  isCurrent ? "text-accent-text" : "text-ink hover:underline",
                )}
              >
                {track.name}
              </Link>
              {track.explicit && (
                <Badge variant="outline" className="shrink-0 px-1 py-0">
                  e
                </Badge>
              )}
            </div>
            <p className="text-ink-muted mt-0.5 truncate text-[12px]">
              <ArtistLinks artists={track.artists} />
            </p>
          </div>
        </div>
      </td>

      {kind === "playlist" && (
        <td className="text-ink-muted hidden max-w-[16rem] truncate py-2.5 pr-3 align-middle text-[12px] md:table-cell">
          {track.album?.id ? (
            <Link
              href={`/album/${track.album.id}`}
              className="hover:text-ink truncate hover:underline"
            >
              {track.album.name}
            </Link>
          ) : (
            track.album?.name
          )}
        </td>
      )}

      {kind === "playlist" && (
        <td className="text-ink-subtle tabular hidden py-2.5 pr-3 align-middle text-[12px] whitespace-nowrap lg:table-cell">
          {formatDate(track.addedAt)}
        </td>
      )}

      <td className="text-ink-muted tabular py-2.5 pr-3 text-right align-middle font-mono text-[12px] whitespace-nowrap sm:pr-4">
        {formatDuration(track.durationMs)}
      </td>
    </tr>
  );
}

function TrackList({
  tracks,
  total,
  kind,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: {
  tracks: TrackDTO[];
  total: number;
  kind: Kind;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}) {
  const { targetRef, isVisible } = useIntersectionObserver({
    rootMargin: "320px",
  });

  React.useEffect(() => {
    if (isVisible && hasMore && !isLoadingMore) onLoadMore();
  }, [isVisible, hasMore, isLoadingMore, onLoadMore]);

  if (tracks.length === 0) {
    return (
      <div className="border-line text-ink-muted rounded-xl border border-dashed px-6 py-14 text-center text-[13px]">
        this {kind} has no tracks to download.
      </div>
    );
  }

  return (
    <div className="border-line bg-canvas overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <caption className="sr-only">
            {total} tracks in this {kind}
          </caption>
          <thead>
            <tr className="border-line bg-surface border-b">
              <th
                scope="col"
                className="text-ink-subtle w-12 py-2 pl-3 text-center text-[11px] font-medium sm:pl-4"
              >
                #
              </th>
              <th
                scope="col"
                className="text-ink-subtle py-2 pr-3 text-left text-[11px] font-medium"
              >
                title
              </th>
              {kind === "playlist" && (
                <th
                  scope="col"
                  className="text-ink-subtle hidden py-2 pr-3 text-left text-[11px] font-medium md:table-cell"
                >
                  album
                </th>
              )}
              {kind === "playlist" && (
                <th
                  scope="col"
                  className="text-ink-subtle hidden py-2 pr-3 text-left text-[11px] font-medium lg:table-cell"
                >
                  added
                </th>
              )}
              <th
                scope="col"
                className="text-ink-subtle py-2 pr-3 text-right text-[11px] font-medium sm:pr-4"
              >
                time
              </th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((track, index) => (
              <TrackRow
                key={`${track.id}-${index}`}
                track={track}
                index={index}
                kind={kind}
              />
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div ref={targetRef} className="p-3">
          {isLoadingMore ? (
            <div className="space-y-2" aria-live="polite" aria-busy="true">
              <span className="sr-only">loading more tracks</span>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-full" />
              ))}
            </div>
          ) : (
            <p className="text-ink-subtle py-2 text-center text-[12px]">
              {tracks.length} of {total} loaded
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export { TrackList };
