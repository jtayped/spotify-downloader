"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { TrackDTO } from "@/types/api";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatDuration, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Clock } from "lucide-react";

export const columns: ColumnDef<TrackDTO>[] = [
  {
    accessorKey: "index",
    header: "",
    cell: ({ row }) => (
      <div className="relative flex items-center justify-center">
        <span className="text-muted-foreground font-medium">
          {row.index + 1}
        </span>
      </div>
    ),
    enableHiding: true,
  },
  {
    accessorKey: "name",
    header: "Title",
    cell: ({ row }) => {
      const track = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="bg-muted relative h-10 w-10 shrink-0 overflow-hidden rounded">
            {track.album.imageUrl ? (
              <Image
                src={track.album.imageUrl}
                alt={track.album.name}
                fill
                className="object-cover"
                sizes="40px"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <HugeiconsIcon
                  icon={Music}
                  size={20}
                  className="text-muted-foreground/50"
                />
              </div>
            )}
          </div>

          {/* Text Info */}
          <div className="flex min-w-[120px] flex-col overflow-hidden">
            <Link
              href={`/track/${track.id}`}
              className="text-foreground truncate font-medium hover:underline"
            >
              {track.name}
            </Link>
            <div className="text-muted-foreground flex items-center gap-2 truncate text-sm">
              {track.explicit && (
                <Badge
                  variant="outline"
                  className="border-muted-foreground/40 h-4 px-1 py-0 text-[10px]"
                >
                  E
                </Badge>
              )}
              <span className="truncate">
                {track.artists.map((a) => a.name).join(", ")}
              </span>
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "album",
    header: () => <span className="hidden md:inline">Album</span>,
    cell: ({ row }) => (
      <span className="text-muted-foreground hidden max-w-[200px] truncate md:inline-block">
        {row.original.album.name}
      </span>
    ),
  },
  {
    accessorKey: "addedAt",
    header: () => <span className="hidden lg:inline">Date Added</span>,
    cell: ({ row }) => (
      <span className="text-muted-foreground hidden whitespace-nowrap lg:inline-block">
        {formatDate(row.original.addedAt)}
      </span>
    ),
  },
  {
    accessorKey: "durationMs",
    header: () => (
      <div className="flex justify-end pr-4">
        <Clock className="text-muted-foreground" size={17} />
      </div>
    ),
    cell: ({ row }) => (
      <div className="font-variant-numeric text-muted-foreground text-right pr-4 tabular-nums">
        {formatDuration(row.original.durationMs)}
      </div>
    ),
  },
];
