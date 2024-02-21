"use client";

import { getElementId, getElementType } from "@/lib/util";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaSearch } from "react-icons/fa";

export default function PlaylistDownloader() {
  const router = useRouter();

  const [error, setError] = useState(false);
  const [url, setUrl] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();

    const element = getElementType(url);

    if (element === "playlist" || element === "track") {
      const id = getElementId(url);
      router.push(`/${element}/${id}`);
    } else {
      setError(
        "This url is invalid, it must be a spotify link for a playlist or a track"
      );
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="w-full flex items-center justify-between gap-2 text-white bg-white/5 backdrop-blur-md border border-white/10 p-2 rounded-xl z-10"
    >
      <button
        className="transition-colors p-2 rounded text-white/50"
        type="submit"
      >
        <FaSearch />
      </button>
      <div className="flex items-center gap-3 w-full">
        <input
          type="text"
          placeholder="Enter a spotify link"
          className="outline-none bg-transparent w-full"
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
    </form>
  );
}
