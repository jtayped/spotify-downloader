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

  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const download = async () => {
      // Get downloadable type
      const type = currentDownload.type;

      // Handle different types of downloadables
      if (type === "playlist") await downloadPlaylist(currentDownload);
      else if (type === "track") await downloadTrack(currentDownload);

      addToDownloaded(currentDownload);
      setDownloading(false);
    };

    if (currentDownload) {
      download();
    }
  }, [currentDownload]);

  // Trigger to move from track to track
  useEffect(() => {
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

    if (queue.length !== 0 && !downloading) {
      // Set the download to next in queue
      const next = nextInQueue();
      setCurrentDownload(next || null);
      setDownloading(true);
    } else if (!downloading) {
      // On finish remove the last download
      setCurrentDownload(null);
    }
  }, [queue, downloading]);

  const downloadPlaylist = async (playlist) => {
    try {
      // Download playlist
      const response = await axios.post("/api/download/playlist", playlist, {
        responseType: "blob",
        timeout: 0,
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
      downloadBlob(response.data, filename);
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
  const value = { addDownload, currentDownload, itemState, queue };

  return (
    <DownloaderContext.Provider value={value}>
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full md:w-[700px] z-10"
        style={{ padding: 12 }}
      >
        <Queue />
      </div>
      {children}
    </DownloaderContext.Provider>
  );
};
