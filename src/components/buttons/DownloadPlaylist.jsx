"use client";

import { SOCKET_PORT } from "@/config/app";
import { downloadBlob, getFilenameFromHeaders } from "@/lib/util";
import axios from "axios";
import { useState, useEffect } from "react";
import { FiDownload } from "react-icons/fi";
import { io } from "socket.io-client";

const DownloadPlaylist = ({ playlist }) => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDownload = async () => {
    setDownloading(true);

    const socket = io(`:${SOCKET_PORT}`, {
      path: "/api/socket",
      addTrailingSlash: false,
    });
    socket.on("connect_error", (err) => {
      console.error(`connect_error due to ${err.message}`);
    });
    socket.on("progress", (progress) => setProgress(progress));

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
        <span className="w-[90px]">{progress}%</span>
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
