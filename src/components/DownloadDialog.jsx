"use client";
import { useDownloader } from "@/context/Download";
import { MdOutlineClose } from "react-icons/md";
import { motion } from "framer-motion";
import { FaPersonRunning, FaPersonWalking } from "react-icons/fa6";

const DownloadDialog = () => {
  const { dialogItem, closeDialog, addDownload } = useDownloader();

  const handleDownload = (speed) => {
    addDownload(dialogItem, speed);
    closeDialog();
  };

  if (!dialogItem) return;

  return (
    <div className="fixed w-full h-screen flex items-center justify-center z-50 px-7">
      <motion.div
        initial={{ backgroundColor: "rgb(0 0 0 / 0)" }}
        animate={{ backgroundColor: "rgb(0 0 0 / 0.5)" }}
        transition={{ duration: 0.1 }}
        onClick={closeDialog}
        className="absolute top-0 left-0 w-full h-full bg-black/50"
      />
      <motion.main
        initial={{ y: 30, scale: 0.5, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.1 }}
        className="w-full md:w-[400px] bg-white/10 border border-white/10 p-4 backdrop-blur-xl text-text rounded-xl relative"
      >
        <button className="absolute top-3 right-3" onClick={closeDialog}>
          <MdOutlineClose size={23} />
        </button>
        <p className="text-xl font-semibold">Donwload {dialogItem.name}</p>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <button
            onClick={() => handleDownload("fast")}
            className="bg-white/10 rounded-lg flex flex-col gap-3 items-center justify-center p-4 text-xs text-white/70 hover:text-white transition-colors border border-white/10"
          >
            <FaPersonRunning size={50} />
            Fast download
          </button>
          <button
            onClick={() => handleDownload("slow")}
            className="bg-white/10 rounded-lg flex flex-col gap-3 items-center justify-center p-4 text-xs text-white/70 hover:text-white transition-colors border border-white/10"
          >
            <FaPersonWalking size={50} />
            Slow download
          </button>
        </div>
      </motion.main>
    </div>
  );
};

export default DownloadDialog;
