"use client";

import { downloadBlob, getFilenameFromHeaders } from "@/lib/util";
import axios from "axios";
import { FiDownload } from "react-icons/fi";

const DownloadPlaylist = ({ playlist }) => {
  const handleDownload = async () => {
    const response = await axios.post(
      "/spotify-downloader/api/download/playlist",
      playlist,
      { responseType: "blob" }
    );

    const filename = getFilenameFromHeaders(response.headers);
    downloadBlob(response.data, filename);
  };

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
