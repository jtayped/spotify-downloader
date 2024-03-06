"use client";
import { useDownloader } from "@/context/Download";
import { MdOutlineClose } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { FaPersonRunning, FaPersonWalking } from "react-icons/fa6";
import { useState } from "react";

const DownloadDialog = () => {
  const {
    dialogItem,
    closeDialog,
    addDownload,
    setDefaultSpeed,
    defaultSpeed,
  } = useDownloader();

  const [rememberSpeed, setRememberSpeed] = useState(false);

  const handleDownload = (speed) => {
    addDownload(dialogItem, speed);
    closeDialog();

    if (rememberSpeed) {
      setDefaultSpeed(speed);
    }
  };

  return (
    <AnimatePresence>
      {dialogItem && !defaultSpeed ? (
        <div className="fixed w-full h-screen flex items-center justify-center z-50 px-7">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={closeDialog}
            className="absolute top-0 left-0 w-full h-full bg-black/70"
          />
          <motion.main
            initial={{ y: 60, scale: 0, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 400, scale: 0, opacity: 0 }}
            className="w-full md:w-[400px] bg-white/10 border border-white/10 p-4 backdrop-blur-xl text-text rounded-xl relative"
          >
            <button className="absolute top-3 right-3" onClick={closeDialog}>
              <MdOutlineClose size={23} />
            </button>
            <p className="text-xl font-semibold">
              Donwload <b>{dialogItem.name}</b>
            </p>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <button
                onClick={() => handleDownload("fast")}
                className="bg-white/10 rounded-lg flex flex-col gap-3 items-center justify-center p-4 text-white/70 hover:text-white group transition-colors border border-white/10"
              >
                <FaPersonRunning size={50} />
                <div>
                  <p className="text-sm">Slow download</p>
                  <p className="text-xs text-white/50">No metadata, .m4a</p>
                </div>
              </button>
              <button
                onClick={() => handleDownload("slow")}
                className="bg-white/10 rounded-lg flex flex-col gap-3 items-center justify-center p-4 text-xs text-white/70 hover:text-white transition-colors border border-white/10"
              >
                <FaPersonWalking size={50} />
                <div>
                  <p className="text-sm">Fast download</p>
                  <p className="text-xs text-white/50">Metadata, .mp3</p>
                </div>
              </button>
            </div>
            <input
              type="checkbox"
              onChange={(e) => setRememberSpeed(e.target.value)}
              value={rememberSpeed}
            />
          </motion.main>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

export default DownloadDialog;
