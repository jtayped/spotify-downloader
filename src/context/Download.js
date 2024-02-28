"use client";

import { downloadBlob, getFilenameFromHeaders } from "@/lib/util";
import React, { createContext, useState, useContext, useEffect } from "react";
import Queue from "@/components/Queue";
import axios from "axios";

const DownloaderContext = createContext();
export const useDownloader = () => useContext(DownloaderContext);
export const DownloaderProvider = ({ children }) => {
  // List of tracks or playlists
  const [queue, setQueue] = useState([]);

  // Current track or playlist being downloaded
  const [currentDownload, setCurrentDownload] = useState(null);

  // Already downloaded playlists or tracks
  const [downloadedItems, setDownloadedItems] = useState([]);

  useEffect(() => {
    const download = async () => {
      // Get downloadable type
      const type = currentDownload.type;

      // Handle different types of downloadables
      if (type === "playlist") await downloadPlaylist(currentDownload);
      else if (type === "track") await downloadTrack(currentDownload);

      addToDownloaded(currentDownload);
      setCurrentDownload(null);
    };

    if (currentDownload) {
      download();
    }
  }, [currentDownload]);

  useEffect(() => {
    if (!currentDownload && queue.length !== 0) {
      // Set current download to next in queue if any
      const next = nextInQueue();
      if (next) setCurrentDownload(next);
    }
  }, [queue, currentDownload]);

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

  const addToDownloaded = (item) => {
    setDownloadedItems((prev) => [...prev, item]);
  };

  const nextInQueue = () => {
    if (queue.length !== 0) {
      // Get first item in list
      const next = queue[0];

      // Remove the item from the state
      setQueue((prev) => [...prev.slice(1, prev.length)]);
      return next;
    }

    // Return null if no items in list
    return null;
  };

  const itemState = (item) => {
    // Check if already downloaded
    const downloadedItem = downloadedItems.find(
      (downloadedItem) => item.id === downloadedItem.id
    );
    if (downloadedItem) return "downloaded";

    if (item.id === currentDownload?.id) return "downloading";

    // Check if
    const queuedItem = queue.find((queueItem) => item.id === queueItem.id);
    if (queuedItem) return "queued";

    return null;
  };

  // Value object to be passed as context value
  const value = { addDownload, currentDownload, itemState };

  return (
    <DownloaderContext.Provider value={value}>
      {true && (
        <div className="fixed bottom-0 left-0 p-5 w-full z-10">
          <Queue />
        </div>
      )}
      {children}
    </DownloaderContext.Provider>
  );
};
