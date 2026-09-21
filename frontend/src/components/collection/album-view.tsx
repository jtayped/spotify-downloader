"use client";

import * as React from "react";

import { CollectionHeader } from "@/components/collection/collection-header";
import { TrackList } from "@/components/collection/track-list";
import { useInfiniteTracks } from "@/hooks/use-infinite-tracks";
import { useRecent } from "@/hooks/use-recent";
import {
  formatReleaseDate,
  formatTotalDuration,
  joinArtists,
} from "@/lib/utils";
import type { AlbumResponse } from "@/types/api";

function AlbumView({ album }: { album: AlbumResponse }) {
  const metadata = album.metadata;
  const id = metadata?.id ?? "";
  const title = metadata?.name ?? "album";
  const artists = joinArtists(metadata?.artists);

  const { tracks, hasMore, isLoadingMore, loadMore } = useInfiniteTracks({
    kind: "album",
    id,
    initialTracks: album.tracks ?? [],
    total: album.total,
  });

  const { remember } = useRecent();
  React.useEffect(() => {
    if (!id) return;
    remember({
      type: "album",
      id,
      name: title,
      subtitle: artists || "album",
      imageUrl: metadata?.imageUrl,
    });
  }, [id, title, artists, metadata?.imageUrl, remember]);

  const loadedMs = tracks.reduce((sum, track) => sum + track.durationMs, 0);
  const allLoaded = tracks.length >= album.total;

  const meta = [
    "album",
    formatReleaseDate(metadata?.releaseDate ?? ""),
    `${album.total} ${album.total === 1 ? "track" : "tracks"}`,
    allLoaded
      ? formatTotalDuration(loadedMs)
      : `${formatTotalDuration(loadedMs)} loaded`,
  ].filter(Boolean);

  // An album row has only #/title/time. 5xl left ~880px of dead gulf between
  // title and duration, and once the downloads panel docks it nearly filled the
  // remaining width, so the page stopped reading as centred. 4xl matches the
  // track page and keeps real margins in both panel states.
  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 px-4 py-8 sm:px-6 sm:py-12">
      <CollectionHeader
        type="album"
        id={id}
        title={title}
        byline={artists}
        meta={meta}
        imageUrl={metadata?.imageUrl}
        externalUrl={metadata?.externalUrl}
      />

      <TrackList
        kind="album"
        tracks={tracks}
        total={album.total}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
      />
    </div>
  );
}

export { AlbumView };
