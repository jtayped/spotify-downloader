"use client";
import { handleDownload } from "@/lib/spotify";
import { FiDownload } from "react-icons/fi";

const DownloadTrack = ({ track }) => {
  return (
    <button
      onClick={() => handleDownload(track.id, "track")}
      className="text-white flex items-center gap-3 bg-accent hover:bg-accent/90 transition-colors rounded p-2.5 text-lg"
    >
      <FiDownload />
    </button>
  );
};

export default DownloadTrack;
