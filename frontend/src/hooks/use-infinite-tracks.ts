"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { AlbumResponse, PlaylistResponse, TrackDTO } from "@/types/api";

const PAGE_SIZE = 50;

type CollectionKind = "playlist" | "album";

interface Page {
  tracks: TrackDTO[];
  total: number;
}

/**
 * Offset-based infinite scroll shared by the playlist and album views. The
 * first page is the server-rendered payload, so the list paints immediately
 * and only subsequent pages hit the network.
 */
export function useInfiniteTracks({
  kind,
  id,
  initialTracks,
  total,
}: {
  kind: CollectionKind;
  id: string;
  initialTracks: TrackDTO[];
  total: number;
}) {
  const query = useInfiniteQuery<Page>({
    queryKey: ["tracks", kind, id],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;
      if (offset === 0) return { tracks: initialTracks, total };

      const { data } = await api.get<PlaylistResponse | AlbumResponse>(
        `/api/${kind}/${id}`,
        { params: { offset, limit: PAGE_SIZE } },
      );
      return { tracks: data.tracks ?? [], total: data.total ?? total };
    },
    getNextPageParam: (_lastPage, pages) => {
      const loaded = pages.reduce((count, page) => count + page.tracks.length, 0);
      return loaded < total ? loaded : undefined;
    },
    initialData: {
      pages: [{ tracks: initialTracks, total }],
      pageParams: [0],
    },
    staleTime: 5 * 60 * 1000,
  });

  const tracks = query.data?.pages.flatMap((page) => page.tracks) ?? [];

  return {
    tracks,
    total,
    hasMore: Boolean(query.hasNextPage),
    isLoadingMore: query.isFetchingNextPage,
    error: query.error,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) {
        void query.fetchNextPage();
      }
    },
  };
}
