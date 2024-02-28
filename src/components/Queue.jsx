"use client";
import React, { useState } from "react";
import { useDownloader } from "@/context/Download";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const Queue = () => {
  const [closed, setClosed] = useState(false);
  const { queue } = useDownloader();

  const currentDownload = null;
  const toggleClose = () => {
    setClosed(!closed);
  };

  if (!currentDownload) return;

  if (closed)
    return (
      <div className="w-full flex justify-center">
        <motion.button
          className="flex items-center gap-2 bg-white/10 border border-white/10 text-white backdrop-blur-md px-6 py-1.5 rounded-full"
          aria-label="Open queue info"
          onClick={toggleClose}
          initial={{ y: 300, scale: 0 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <FiChevronUp size={20} />
          {queue.length} in queue
        </motion.button>
      </div>
    );
  else
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: 300 }}
          animate={{ y: 0 }}
          exit={{ y: 300 }}
          className="w-full bg-white/5 rounded-lg border border-white/20 backdrop-blur-md p-2.5 text-white shadow-lg"
        >
          <div className="flex gap-3">
            <Link href={currentDownload.external_urls.spotify}>
              <Image
                src={
                  currentDownload.type === "playlist"
                    ? currentDownload.images[0].url
                    : currentDownload.album.images[0].url
                }
                width={165}
                height={165}
                className="rounded"
                alt={`${currentDownload.type} cover`}
              />
            </Link>
            <div className="flex flex-col justify-between w-full">
              <div>
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-xl line-clamp-1">
                    {currentDownload.name}
                  </p>
                  <button
                    aria-label="Close queue info"
                    className="text-2xl"
                    onClick={toggleClose}
                  >
                    <FiChevronDown />
                  </button>
                </div>

                {currentDownload.type === "playlist" ? (
                  <span className="text-xs">
                    <p>
                      {currentDownload.followers.total} likes · by{" "}
                      {currentDownload.owner.display_name}
                    </p>
                  </span>
                ) : (
                  <nav className="flex items-center gap-2 text-xs max-w-[190px] whitespace-nowrap overflow-hidden">
                    {currentDownload.artists.map((artist) => (
                      <Link
                        key={artist.id}
                        href={artist.external_urls.spotify}
                        className="hover:underline"
                      >
                        {artist.name}
                      </Link>
                    ))}
                  </nav>
                )}
              </div>
              <div className="text-xs space-y-1">
                <span>
                  {queue.length !== 0 ? (
                    <p className="text-xs line-clamp-1">
                      Next in queue: {queue[0].name}
                    </p>
                  ) : (
                    "Downloading..."
                  )}
                </span>
                <div className="w-full h-1 bg-white/50 rounded-full overflow-hidden">
                  <div className="progress w-full h-full bg-white/90 left-right"></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
};

export default Queue;
