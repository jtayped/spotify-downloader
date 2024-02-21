"use client";
import { useState } from "react";
import { FaPlay, FaPause } from "react-icons/fa";

const PlayTrack = ({ audioUrl }) => {
  const [audio, setAudio] = useState(null);

  const handlePlay = async () => {
    audio.play();
  };

  const handlePause = () => {
    audio.pause();
  };

  const handlePlayPause = () => {
    // If no preview is found it will not play
    if (!audioUrl) return;

    // Fetch audio if hasn't been loaded before
    if (!audio) {
      const audioElement = new Audio(audioUrl);
      setAudio(audioElement);
      console.log(audio);
    }

    if (audio.paused) handlePlay();
    else handlePause();

    console.log(audio.paused);
  };

  return (
    <button
      onClick={handlePlayPause}
      disabled={!audioUrl}
      className="p-2.5 rounded bg-white/10 border border-white/5 hover:bg-white/15 disabled:brightness-75 transition-colors"
    >
      {audio ? audio.paused ? <FaPlay /> : <FaPause /> : <FaPlay />}
    </button>
  );
};

export default PlayTrack;
