import { getPlaylist } from "@/lib/spotify";
import { notFound } from "next/navigation";
import React from "react";
import PlaylistInfo from "@/components/PlaylistInfo";
import TrackList from "@/components/TrackList";
import Search from "@/components/Search";
import HomeButton from "@/components/buttons/HomeButton";

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

  if (id === "null") return;
  const playlist = await fetchPlaylist(id);

  return (
    <div className="w-full flex justify-center">
      <main className="md:mt-[100px] w-full md:w-[700px] py-8 px-5 space-y-4">
        <div className="flex items-center w-full gap-4">
          <HomeButton />
          <Search />
        </div>

        {playlist ? (
          <>
            <PlaylistInfo playlist={playlist} />
            <TrackList tracks={playlist.tracks} />
          </>
        ) : null}
      </main>
    </div>
  );
};

export default PlaylistPage;
