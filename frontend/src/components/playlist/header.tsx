import type { PlaylistMetadata } from "@/types/api";
import { Button } from "@/components/ui/button";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, ExternalLink } from "lucide-react";

interface PlaylistHeaderProps {
  metadata?: PlaylistMetadata;
  totalTracks: number;
}

export const PlaylistHeader = ({
  metadata,
  totalTracks,
}: PlaylistHeaderProps) => {
  if (!metadata) return null;

  return (
    <div className="mb-8 flex w-full flex-col gap-6 md:flex-row md:items-end">
      {/* Cover Image */}
      <div className="mx-auto shrink-0 shadow-lg md:mx-0">
        {metadata.imageUrl ? (
          <Image
            src={metadata.imageUrl}
            alt={metadata.name}
            className="h-48 w-48 object-cover sm:h-56 sm:w-56"
            width={224}
            height={224}
          />
        ) : (
          <div className="bg-muted flex h-48 w-48 items-center justify-center sm:h-56 sm:w-56">
            <span className="text-muted-foreground">No Image</span>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="flex grow flex-col gap-2 text-center md:text-left">
        <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
          Playlist
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
          {metadata.name}
        </h1>

        {metadata.description && (
          <p className="text-muted-foreground mt-2 line-clamp-2 text-sm sm:text-base">
            {metadata.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium md:justify-start">
          <span>{metadata.owner}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{totalTracks} songs</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex justify-center gap-2 md:justify-start">
          <Button size="lg">
            <Download />
            download
          </Button>
          <Button variant="outline" size="icon-lg" asChild>
            <Link href={metadata.externalUrl} target="_blank" rel="noreferrer">
              <ExternalLink />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
