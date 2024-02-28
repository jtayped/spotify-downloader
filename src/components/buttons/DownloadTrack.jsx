"use client";
import { FiDownload } from "react-icons/fi";
import Spinner from "../Spinner";
import { useDownloader } from "@/context/Download";

const DownloadTrack = ({ track }) => {
  const { addDownload, currentDownload, itemState } = useDownloader();

  const handleDownload = () => {
    addDownload(track);
  };
  if (itemState(track) === "queued" || itemState(track) === "downloading")
    return (
      <div className="text-white bg-accent/80 transition-colors rounded p-1.5 md:p-2.5 text-lg">
        <Spinner />
      </div>
    );
  return (
    <button
      onClick={() => handleDownload()}
      aria-label="Download Track"
      className="text-white bg-accent hover:bg-accent/90 transition-colors rounded p-1.5 md:p-2.5 text-lg"
    >
      <FiDownload />
    </button>
  );
};

export default DownloadTrack;
