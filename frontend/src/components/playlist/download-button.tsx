"use client";

import { Download, Loader2, CheckCircle, XCircle } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { usePlaylistDownload } from "@/hooks/use-playlist-download";
import { cn } from "@/lib/utils";

interface DownloadButtonProps {
  playlistId: string;
}

const DownloadButton = ({ playlistId }: DownloadButtonProps) => {
  const { startDownload, status, progress, message, reset } =
    usePlaylistDownload(playlistId);

  const isBusy =
    status === "initializing" ||
    status === "processing" ||
    status === "downloading";

  if (status === "complete") {
    return (
      <Button
        variant="outline"
        className="gap-2 text-green-600"
        onClick={reset}
      >
        <CheckCircle className="h-4 w-4" />
        Done. Download Again?
      </Button>
    );
  }

  return (
    <div className="grid w-full max-w-xs gap-2">
      <Button
        size="lg"
        onClick={startDownload}
        disabled={isBusy}
        className={cn(
          status === "error" && "bg-destructive hover:bg-destructive/90",
        )}
      >
        {status === "idle" && (
          <>
            <Download className="mr-2 h-4 w-4" /> Download
          </>
        )}

        {(status === "initializing" || status === "downloading") && (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {status === "initializing" ? "Starting..." : "Saving..."}
          </>
        )}

        {status === "processing" && (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {Math.round(progress)}%
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mr-2 h-4 w-4" /> Retry
          </>
        )}
      </Button>

      {/* Status Message & Progress Bar Area */}
      {status !== "idle" && (
        <div className="animate-in fade-in slide-in-from-top-1 w-fit">
          <p className="text-muted-foreground max-w-xs truncate text-left text-xs whitespace-nowrap">
            {message}
          </p>
        </div>
      )}
    </div>
  );
};

export default DownloadButton;
