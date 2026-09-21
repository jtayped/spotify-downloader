"use client";

import * as React from "react";

interface PreviewTrack {
  id: string;
  name: string;
  artists: string;
  imageUrl?: string;
  previewUrl: string;
}

interface PlayerContextValue {
  current: PreviewTrack | null;
  isPlaying: boolean;
  /** 0–1 through the 30-second clip. */
  fraction: number;
  failed: boolean;
  toggle: (track: PreviewTrack) => void;
  stop: () => void;
}

const PlayerContext = React.createContext<PlayerContextValue | null>(null);

/**
 * One shared <audio> element for the whole app, so starting a preview always
 * stops the previous one and only ever one clip is audible.
 */
export function PreviewPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = React.useState<PreviewTrack | null>(null);
  const [isPlaying, setPlaying] = React.useState(false);
  const [fraction, setFraction] = React.useState(0);
  const [failed, setFailed] = React.useState(false);

  const getAudio = React.useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "none";
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  React.useEffect(() => {
    const audio = getAudio();

    const onTime = () => {
      if (audio.duration > 0) setFraction(audio.currentTime / audio.duration);
    };
    const onEnded = () => {
      setPlaying(false);
      setFraction(0);
    };
    const onError = () => {
      setPlaying(false);
      setFailed(true);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.pause();
    };
  }, [getAudio]);

  const stop = React.useCallback(() => {
    const audio = getAudio();
    audio.pause();
    setPlaying(false);
    setCurrent(null);
    setFraction(0);
  }, [getAudio]);

  const toggle = React.useCallback(
    (track: PreviewTrack) => {
      const audio = getAudio();

      if (current?.id === track.id) {
        if (audio.paused) {
          void audio.play().catch(() => setFailed(true));
          setPlaying(true);
        } else {
          audio.pause();
          setPlaying(false);
        }
        return;
      }

      setFailed(false);
      setFraction(0);
      setCurrent(track);
      audio.src = track.previewUrl;
      void audio.play().catch(() => {
        setPlaying(false);
        setFailed(true);
      });
      setPlaying(true);
    },
    [current, getAudio],
  );

  const value = React.useMemo<PlayerContextValue>(
    () => ({ current, isPlaying, fraction, failed, toggle, stop }),
    [current, isPlaying, fraction, failed, toggle, stop],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export function usePreviewPlayer(): PlayerContextValue {
  const context = React.useContext(PlayerContext);
  if (!context) {
    throw new Error(
      "usePreviewPlayer must be used inside <PreviewPlayerProvider>",
    );
  }
  return context;
}

export type { PreviewTrack };
