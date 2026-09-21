"use client";

import { Pause, Play } from "lucide-react";

import { Tooltip } from "@/components/ui/tooltip";
import { usePreviewPlayer } from "@/hooks/use-preview-player";
import { cn } from "@/lib/utils";
import type { TrackDTO, TrackDetailsDTO } from "@/types/api";

/**
 * Plays Spotify's 30-second preview clip. Spotify deprecated `preview_url`
 * for most applications in late 2024, so an empty value is the common case,
 * not an error. The control stays visible and explains itself rather than
 * disappearing and making the row layout jump.
 */
function PlayButton({
  track,
  className,
  size = "md",
}: {
  track: TrackDTO | TrackDetailsDTO;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const { current, isPlaying, toggle } = usePreviewPlayer();

  const available = Boolean(track.previewUrl);
  const active = current?.id === track.id;
  const playing = active && isPlaying;

  const dimensions = {
    sm: "size-7 [&_svg]:size-3",
    md: "size-9 [&_svg]:size-4",
    lg: "size-12 [&_svg]:size-5",
  }[size];

  const button = (
    <button
      type="button"
      disabled={!available}
      aria-label={
        !available
          ? `no preview available for ${track.name}`
          : playing
            ? `pause preview of ${track.name}`
            : `play 30 second preview of ${track.name}`
      }
      onClick={() =>
        available &&
        toggle({
          id: track.id,
          name: track.name,
          artists: track.artists.map((artist) => artist.name).join(", "),
          imageUrl: track.album?.imageUrl,
          previewUrl: track.previewUrl,
        })
      }
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-colors duration-150 ease-out",
        dimensions,
        available
          ? active
            ? "bg-accent text-accent-ink"
            : "text-ink hover:bg-raised border-line border"
          : "text-ink-subtle/50 border-line/60 cursor-not-allowed border",
        className,
      )}
    >
      {playing ? <Pause /> : <Play className="translate-x-px" />}
    </button>
  );

  if (available) return button;

  return (
    <Tooltip label="spotify no longer supplies a preview clip for this track">
      <span className="inline-flex">{button}</span>
    </Tooltip>
  );
}

export { PlayButton };
