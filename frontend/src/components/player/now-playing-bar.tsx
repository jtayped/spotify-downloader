"use client";

import { Pause, Play, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CoverArt } from "@/components/ui/cover-art";
import { usePreviewPlayer } from "@/hooks/use-preview-player";

/**
 * Appears only while a preview is loaded. It is deliberately small: this is a
 * download tool that happens to audition clips, not a music player.
 */
function NowPlayingBar() {
  const { current, isPlaying, fraction, failed, toggle, stop } =
    usePreviewPlayer();

  if (!current) return null;

  return (
    <div
      role="region"
      aria-label="preview player"
      className="animate-rise fixed bottom-4 left-1/2 z-30 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2"
    >
      <div className="border-line bg-overlay shadow-float overflow-hidden rounded-xl border">
        <div className="flex items-center gap-3 p-2.5">
          <CoverArt
            src={current.imageUrl}
            alt=""
            className="size-10"
            rounded="rounded-md"
          />

          <div className="min-w-0 flex-1">
            <p className="text-ink truncate text-[13px] font-medium">
              {current.name}
            </p>
            <p className="text-ink-muted truncate text-[11px]">
              {failed ? "preview could not be played" : current.artists}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={isPlaying ? "pause preview" : "resume preview"}
            onClick={() => toggle({ ...current })}
          >
            {isPlaying ? <Pause /> : <Play />}
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="stop preview"
            onClick={stop}
          >
            <X />
          </Button>
        </div>

        <div className="bg-raised h-0.5 w-full">
          <div
            className="bg-accent h-full origin-left"
            style={{ transform: `scaleX(${Math.min(1, Math.max(0, fraction))})` }}
          />
        </div>
      </div>
    </div>
  );
}

export { NowPlayingBar };
