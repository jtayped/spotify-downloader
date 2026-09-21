"use client";

import * as React from "react";
import { Disc3 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Square artwork with a real fallback. Spotify image URLs occasionally 404 and
 * playlists can have no image at all, so the placeholder is a first-class
 * state rather than a broken-image icon.
 */
function CoverArt({
  src,
  alt,
  className,
  iconClassName,
  rounded = "rounded-lg",
  priority = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  iconClassName?: string;
  rounded?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = React.useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn(
        "bg-raised border-line relative shrink-0 overflow-hidden border",
        rounded,
        className,
      )}
    >
      {showImage ? (
        /* Spotify serves art from several CDN origins that next/image would
           each need allow-listed, so a plain img is the correct call here. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <div className="text-ink-subtle flex size-full items-center justify-center">
          <Disc3 className={cn("size-1/3", iconClassName)} aria-hidden />
        </div>
      )}
    </div>
  );
}

export { CoverArt };
