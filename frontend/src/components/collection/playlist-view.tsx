"use client";

import * as React from "react";

import { CollectionHeader } from "@/components/collection/collection-header";
import { TrackList } from "@/components/collection/track-list";
import { useInfiniteTracks } from "@/hooks/use-infinite-tracks";
import { useRecent } from "@/hooks/use-recent";
import { formatTotalDuration } from "@/lib/utils";
import type { PlaylistResponse } from "@/types/api";

function PlaylistView({ playlist }: { playlist: PlaylistResponse }) {
  const metadata = playlist.metadata;
  const id = metadata?.id ?? "";
  const title = metadata?.name ?? "playlist";

  const { tracks, hasMore, isLoadingMore, loadMore } = useInfiniteTracks({
    kind: "playlist",
    id,
    initialTracks: playlist.tracks ?? [],
    total: playlist.total,
  });

  const { remember } = useRecent();
  React.useEffect(() => {
    if (!id) return;
    remember({
      type: "playlist",
      id,
      name: title,
      subtitle: metadata?.owner ? `by ${metadata.owner}` : "playlist",
      imageUrl: metadata?.imageUrl,
    });
  }, [id, title, metadata?.owner, metadata?.imageUrl, remember]);

  // Runtime is only known for the pages fetched so far, so it is labelled as a
  // partial sum rather than presented as the playlist's true length.
  const loadedMs = tracks.reduce((sum, track) => sum + track.durationMs, 0);
  const allLoaded = tracks.length >= playlist.total;

  const meta = [
    "playlist",
    `${playlist.total} ${playlist.total === 1 ? "track" : "tracks"}`,
    allLoaded
      ? formatTotalDuration(loadedMs)
      : `${formatTotalDuration(loadedMs)} loaded`,
  ];

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-10 px-4 py-8 sm:px-6 sm:py-12">
      <CollectionHeader
        type="playlist"
        id={id}
        title={title}
        byline={metadata?.owner ? `by ${metadata.owner}` : undefined}
        meta={meta}
        description={metadata?.description}
        imageUrl={metadata?.imageUrl}
        externalUrl={metadata?.externalUrl}
      />

      <TrackList
        kind="playlist"
        tracks={tracks}
        total={playlist.total}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
      />
    </div>
  );
}

export { PlaylistView };
