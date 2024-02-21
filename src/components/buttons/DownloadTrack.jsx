"use client";
import { handleTrackDownload } from "@/lib/spotify";
import { FiDownload } from "react-icons/fi";

const DownloadTrack = ({ track }) => {
  const fileName = `${track.name} by ${track.artists[0].name}.mp3`;
  return (
    <button
      onClick={() => handleTrackDownload(track, fileName)}
      className="text-white bg-accent hover:bg-accent/90 transition-colors rounded p-2.5 text-lg"
    >
      <FiDownload />
    </button>
  );
};

export default DownloadTrack;
