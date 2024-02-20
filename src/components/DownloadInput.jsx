"use client";

import { getElementId, getElementType } from "@/lib/spotify";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MdOutlineSearch } from "react-icons/md";

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
      className="flex items-center justify-between gap-2 text-white bg-white/5 backdrop-blur-md border border-white/10 p-2 rounded-lg w-[512px] z-10"
    >
      <div className="py-2 flex items-center gap-3 w-full">
        <MdOutlineSearch size={27} className="text-gray-200" />
        <input
          type="text"
          placeholder="Enter a spotify link"
          className="outline-none bg-transparent w-full"
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <button
        className="bg-accent/50 hover:bg-accent/60 transition-colors border border-accent/10 px-5 py-2 rounded"
        type="submit"
      >
        Search
      </button>
    </form>
  );
}
