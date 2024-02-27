"use client";
import { downloadBlob, getFilenameFromHeaders } from "@/lib/util";
import axios from "axios";
import { useState } from "react";
import { FiDownload } from "react-icons/fi";

const DownloadPlaylist = ({ playlist }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);

    const response = await axios.post("/api/download/playlist", playlist, {
      responseType: "blob",
    });

    const filename = getFilenameFromHeaders(response.headers);
    downloadBlob(response.data, filename);

    setDownloading(false);
  };

  return (
    <button
      onClick={() => handleDownload(playlist.id, playlist.type)}
      aria-label="Download Playlist"
      className="text-white flex items-center gap-3 bg-accent hover:bg-accent/90 transition-colors rounded px-5 py-2"
    >
      {downloading ? (
        <span className="w-[90px]"></span>
      ) : (
        <>
          <FiDownload className="text-md" />
          Download
        </>
      )}
    </button>
  );
};

export default DownloadPlaylist;
