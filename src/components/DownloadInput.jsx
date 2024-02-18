"use client";

import { useState } from "react";
import axios from "axios";

export default function PlaylistDownloader() {
  const [downloading, setDownloading] = useState(false);
  const [playlistId, setPlaylistId] = useState("");

  const handleDownload = async () => {
    setDownloading(true);

    try {
      const response = await axios.get(`/api/playlist/${playlistId}`, {
        responseType: "blob",
        timeout: 3600*1000,
      });

      // Create a blob URL and initiate download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "playlist.zip");
      document.body.appendChild(link);
      link.click();

      setDownloading(false);
    } catch (error) {
      console.error(error);
      setDownloading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={playlistId}
        onChange={(e) => setPlaylistId(e.target.value)}
        placeholder="Enter Spotify Playlist ID"
      />
      <button onClick={handleDownload}>Download Playlist</button>
    </div>
  );
}
