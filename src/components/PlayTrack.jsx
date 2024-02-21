"use client";
import { useState, useEffect } from "react";
import { FaPlay, FaPause } from "react-icons/fa";

const PlayTrack = ({ audioUrl }) => {
  const [audio, setAudio] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchAudio = () => {
      const audio = new Audio(audioUrl);
      audio.onended = function () {
        setPlaying(false);
      };
      audio.ontimeupdate = function () {
        setProgress(audio.currentTime);
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
  console.log((audio.currentTime / audio.duration) * 100);
  return (
    <div className="relative">
      {audio ? (
        <svg
          viewBox="0 0 36 36"
          className="absolute top-1/2 -translate-x-1/2 left-1/2 -translate-y-1/2"
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            className="progress-ring__circle"
            stroke="#ffffff"
            strokeWidth="2"
            fill="transparent"
            r="15.91549430918954"
            cx="18"
            cy="18"
            style={{
              strokeDasharray: `${
                (audio.currentTime / audio.duration) * 100
              } 100`,
              transition: "stroke-dasharray 0.3s ease",
            }}
          />
        </svg>
      ) : null}
      <button
        onClick={handleClick}
        disabled={!audioUrl}
        className="relative p-1.5 md:p-2.5 rounded bg-white/10 border border-white/5 hover:bg-white/15 disabled:hover:bg-white/10 disabled:brightness-50 transition-colors"
      >
        {playing ? <FaPause /> : <FaPlay />}
      </button>
    </div>
  );
};

export default PlayTrack;
