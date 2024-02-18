"use client";

import { useState } from "react";
import axios from "axios";
import { getPlaylistId } from "@/lib/spotify";

export default function PlaylistDownloader() {
  const [downloading, setDownloading] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState("");

  const handleDownload = async () => {
    setDownloading(true);

    try {
      // Get playlist data
      const id = getPlaylistId(playlistUrl);
      const response = await axios.get(
        `/spotify-downloader/api/playlist/${id}`
      );
      const playlist = response.data;

      // Download playlist
      const donwloadRes = await axios.post(
        `/spotify-downloader/api/download/playlist`,
        { playlist },
        { responseType: "blob" }
      );

      // Create a blob URL and initiate download
      const url = window.URL.createObjectURL(new Blob([donwloadRes.data]));
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
        value={playlistUrl}
        onChange={(e) => setPlaylistUrl(e.target.value)}
        placeholder="Enter Spotify Playlist ID"
      />
      <button onClick={handleDownload}>Download Playlist</button>
    </div>
  );
}
