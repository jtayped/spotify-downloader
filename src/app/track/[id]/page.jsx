import { getTrack } from "@/lib/spotify";
import { notFound } from "next/navigation";
import React from "react";
import Search from "@/components/Search";
import TrackInfo from "@/components/TrackInfo";
import HomeButton from "@/components/buttons/HomeButton";

export const runtime = "edge";

const fetchTrack = async (id) => {
  try {
    const track = await getTrack(id);
    return track;
  } catch (error) {
    console.error(error);
    notFound();
  }
};

const TrackPage = async ({ params }) => {
  const { id } = params;

  if (id === "null") return;

  const track = await fetchTrack(id);

  return (
    <div className="w-full flex justify-center">
      <main className="md:mt-[100px] w-full md:w-[700px] py-8 px-5 space-y-4">
        <div className="flex items-center w-full gap-4">
          <HomeButton />
          <Search />
        </div>

        {track ? (
          <div className="bg-white/5 border border-white/10 w-full backdrop-blur-md p-5 rounded-xl flex flex-col gap-5 text-text">
            <TrackInfo track={track} />
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default TrackPage;
