"use client";

import { downloadBlob } from "@/lib/util";
import React, { createContext, useState, useContext, useEffect } from "react";

const DownloaderContext = createContext();
export const useDownloader = () => useContext(DownloaderContext);
export const DownloaderProvider = ({ children }) => {
  // List of tracks or playlists
  const [queue, setQueue] = useState([]);

  // Current track or playlist being downloaded
  const [currentDownload, setCurrentDownload] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(async () => {
    const download = async () => {
      // Update state
      setDownloading(true);

      // Get downloadable type
      const type = currentDownload.type;

      // Handle different types of downloadables
      if (type === "playlist") await downloadPlaylist(currentDownload);
      else if (type === "track") await downloadTrack(currentDownload);

      // Set current download to next in queue if any
      const next = nextInQueue();
      if (next) setCurrentDownload(next);
      else {
        // Update state
        setDownloading(false);
      }
    };

    if (currentDownload) {
      download();
    }
  }, [currentDownload]);

  const downloadPlaylist = async (playlist) => {
    try {
      // Download playlist
      const response = await axios.post("/api/download/playlist", playlist, {
        responseType: "blob",
      });

      // Download blob with appropriate filename from headers
      const filename = getFilenameFromHeaders(response.headers);
      downloadBlob(response.data, filename);
    } catch (error) {
      console.error(error);
    }
  };

  const downloadTrack = async (track) => {
    try {
      // Download track
      const response = await axios.post("/api/download/track", track, {
        responseType: "blob",
      });

      // Download blob with appropriate filename from headers
      const filename = getFilenameFromHeaders(response.headers);
      await downloadBlob(response.data, filename);
    } catch (error) {
      console.error(error);
    }
  };

  const addDownload = (spotifyItem) => {
    setQueue((prev) => [...prev, spotifyItem]);
  };

  const nextInQueue = () => {
    if (queue.length !== 0) {
      // Get first item in list
      const next = queue[0];

      // Remove the item from the state
      setQueue((prev) => [...prev.slice(1, prev.length - 1)]);
      return next;
    }

    // Return null if no items in list
    return null;
  };

  // Value object to be passed as context value
  const value = { addDownload };

  return (
    <DownloaderContext.Provider value={value}>
      {children}
    </DownloaderContext.Provider>
  );
};
