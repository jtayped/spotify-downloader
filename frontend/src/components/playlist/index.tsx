"use client";

import type { PlaylistResponse, TrackDTO } from "@/types/api";
import React, { useState } from "react";
import { PlaylistHeader } from "./header";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { api } from "@/lib/api"; // Assuming you have an axios instance here

const LOAD_LIMIT = 50;

const PlaylistView = ({ playlist }: { playlist: PlaylistResponse }) => {
  // 1. Initialize state with the server-side data
  const [tracks, setTracks] = useState<TrackDTO[]>(playlist.tracks);
  const [isLoading, setIsLoading] = useState(false);

  // 2. Determine if there is more data to load
  const totalTracks = playlist.total;
  const hasMore = tracks.length < totalTracks;

  // 3. The function to load more data
  const loadMoreTracks = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      // Use the current length as the offset
      const currentOffset = tracks.length;

      // Assuming your route is /api/playlist/[id]
      // We pass the new offset and our limit
      const { data } = await api.get<PlaylistResponse>(
        `/api/playlist/${playlist.metadata?.externalUrl.split("/").pop() ?? ""}`, // Extract ID or pass it via props if available
        {
          params: {
            offset: currentOffset,
            limit: LOAD_LIMIT,
          },
        },
      );

      // 4. Append new tracks to existing list
      if (data.tracks && data.tracks.length > 0) {
        setTracks((prev) => [...prev, ...data.tracks]);
      }
    } catch (error) {
      console.error("Failed to load more tracks", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full space-y-8 p-4 md:p-8">
      <PlaylistHeader metadata={playlist.metadata} totalTracks={totalTracks} />

      <section className="w-full">
        <DataTable
          columns={columns}
          data={tracks}
          onEndReached={loadMoreTracks}
          hasMore={hasMore}
          isLoading={isLoading}
        />
      </section>
    </div>
  );
};

export default PlaylistView;
