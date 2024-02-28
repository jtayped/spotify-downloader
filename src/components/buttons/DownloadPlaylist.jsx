"use client";
import { FiDownload } from "react-icons/fi";
import Spinner from "../Spinner";
import { useDownloader } from "@/context/Download";
import Check from "../Check";

const DownloadPlaylist = ({ playlist }) => {
  const { addDownload, itemState } = useDownloader();

  const handleDownload = () => {
    addDownload(playlist);
  };

  // Check if downloaded
  if (itemState(playlist) === "downloaded") {
    return (
      <div className="flex items-center gap-3 bg-accent/50 px-5 py-2 rounded">
        <Check />
        Downloaded
      </div>
    );

    // Check if queued
  } else if (itemState(playlist) === "queued") {
    return (
      <div className="flex items-center gap-3 bg-accent/10 px-5 py-2 rounded">
        <Spinner />
        Queued
      </div>
    );

    // Check if downloading
  } else if (itemState(playlist) === "downloading")
    return (
      <div className="flex items-center gap-3 bg-accent/80 px-5 py-2 rounded">
        <Spinner />
        Downloading...
      </div>
    );
  // Return download button
  else
    return (
      <button
        onClick={() => handleDownload()}
        aria-label="Download Playlist"
        className="text-white flex items-center gap-3 bg-accent hover:bg-accent/90 transition-colors rounded px-5 py-2"
      >
        <FiDownload className="text-md" />
        Download
      </button>
    );
};

export default DownloadPlaylist;
