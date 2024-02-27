"use client";
import { downloadBlob, getFilenameFromHeaders } from "@/lib/util";
import axios from "axios";
import { useState } from "react";
import { FiDownload } from "react-icons/fi";
import Spinner from "../Spinner";

const DownloadTrack = ({ track }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    // Update state
    setDownloading(true);

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
    } finally {
      // Update state
      setDownloading(false);
    }
  };

  if (downloading)
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
