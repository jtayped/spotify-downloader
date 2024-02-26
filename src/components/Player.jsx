"use client";
import { usePlayer } from "@/context/Player";
import {
  BsFillSkipEndFill,
  BsFillSkipStartFill,
  BsFillPlayFill,
  BsFillPauseFill,
} from "react-icons/bs";

const Player = () => {
  const { setIsPlaying, currentTrack } = usePlayer();
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2">
      <div className="md:mt-[100px] w-full md:w-[700px] h-[200px] bg-white/5 backdrop-blur-md border border-white/10 rounded-xl"></div>
    </div>
  );
};

export default Player;
