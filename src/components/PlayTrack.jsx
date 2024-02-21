"use client";
import { useState, useEffect } from "react";
import { FaPlay, FaPause } from "react-icons/fa";

const PlayTrack = ({ audioUrl }) => {
  const [audio, setAudio] = useState(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const fetchAudio = () => {
      const audio = new Audio(audioUrl);
      audio.onended = function () {
        setPlaying(false);
      };
      setAudio(audio);
    };
    fetchAudio();
  }, [audioUrl]);

  const handleClick = () => {
    if (!audio) return;

    if (audio.paused) {
      audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!audioUrl}
      className="p-1.5 md:p-2.5 rounded bg-white/10 border border-white/5 hover:bg-white/15 disabled:hover:bg-white/10 disabled:brightness-75 transition-colors"
    >
      {playing ? <FaPause /> : <FaPlay />}
    </button>
  );
};

export default PlayTrack;
