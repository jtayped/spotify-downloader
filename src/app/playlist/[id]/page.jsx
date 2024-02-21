import { getPlaylist } from "@/lib/spotify";
import { notFound } from "next/navigation";
import React from "react";
import Link from "next/link";
import PlaylistInfo from "@/components/PlaylistInfo";
import TrackList from "@/components/TrackList";
import Search from "@/components/Search";
import { FaArrowLeft } from "react-icons/fa6";

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
          <Link
            href="/"
            className="text-white/50 hover:text-white/90 hover:bg-white/10 transition-colors bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4"
          >
            <FaArrowLeft />
          </Link>
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
