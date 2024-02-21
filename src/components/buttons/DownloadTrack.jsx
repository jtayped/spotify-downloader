"use client";
import { downloadBlob, getFilenameFromHeaders } from "@/lib/util";
import axios from "axios";
import { FiDownload } from "react-icons/fi";

const DownloadTrack = ({ track }) => {
  const handleDownload = async () => {
    const response = await axios.post(
      "/spotify-downloader/api/download/track",
      track,
      { responseType: "blob" }
    );

    const filename = getFilenameFromHeaders(response.headers);
    downloadBlob(response.data, filename);
  };

  return (
    <button
      onClick={() => handleDownload()}
      className="text-white bg-accent hover:bg-accent/90 transition-colors rounded p-1.5 md:p-2.5 text-lg"
    >
      <FiDownload />
    </button>
  );
};

export default DownloadTrack;
