import { getPlaylist } from "@/lib/downloader";
import { notFound } from "next/navigation";
import React from "react";
// import { playlist } from "./test";
import PlaylistInfo from "@/components/PlaylistInfo";
import TrackList from "@/components/TrackList";

const fetchPlaylist = async (id) => {
  try {
    const playlist = await getPlaylist(id);
    return playlist;
  } catch (error) {
    console.error(error);
    notFound();
  }
};

const PlaylistPage = async ({ params }) => {
  const { id } = params;
  const playlist = await fetchPlaylist(id);

  return (
    <div className="w-full flex justify-center">
      <main className="mt-[100px] w-[700px] space-y-5">
        <PlaylistInfo playlist={playlist} />
        <TrackList tracks={playlist.tracks} />
      </main>
    </div>
  );
};

export default PlaylistPage;
