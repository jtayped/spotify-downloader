"use client";

import { handleDownload } from "@/lib/spotify";
import { FiDownload } from "react-icons/fi";

const DownloadPlaylist = ({ playlist }) => {
  return (
    <button
      onClick={() => handleDownload(playlist.id, playlist.type)}
      className="text-white flex items-center gap-3 bg-accent hover:bg-accent/90 transition-colors rounded p-2"
    >
      <FiDownload />
      Download
    </button>
  );
};

export default DownloadPlaylist;
