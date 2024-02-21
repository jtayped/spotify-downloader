"use client";
import axios from "axios";
import { useState } from "react";
import { FaPlay } from "react-icons/fa";

const PlayTrack = ({ audioUrl }) => {
  const [audio, setAudio] = useState(null);

  const handlePlay = async () => {
    // Check if audio exisits and fetch audio if hasn't been loaded before
    if (audioUrl && !audio) {
      const audio = await axios.get(audioUrl);
      setAudio(audio);
    }

    // Play audio
  };

  return (
    <button
      onClick={handlePlay}
      disabled={audioUrl}
      className="p-2.5 rounded bg-white/10 border border-white/5"
    >
      <FaPlay />
    </button>
  );
};

export default PlayTrack;
