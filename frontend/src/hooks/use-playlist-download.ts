"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { initiateDownload, triggerFileDownload } from "@/lib/download-api";
import type { ProgressMessage } from "@/types/api";

type DownloadStatus =
  | "idle"
  | "initializing"
  | "processing"
  | "downloading"
  | "complete"
  | "error";

export function usePlaylistDownload(playlistId: string) {
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  // Use a ref for the WebSocket to prevent re-renders on connection changes
  const socketRef = useRef<WebSocket | null>(null);

  const cleanup = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  // Safety: Cleanup if component unmounts
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const startDownload = async () => {
    try {
      setStatus("initializing");
      setProgress(0);
      setMessage("Starting job...");

      // 1. Initiate Job via HTTP
      const { job_id, ws_url } = await initiateDownload(playlistId);

      // 2. Connect WebSocket
      // Note: Handle ws:// vs wss:// logic here if needed for prod
      const wsBase = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:1323";
      // Construct the full URL. The backend returns "/ws?job_id=...", so we prepend the host
      const fullWsUrl = `${wsBase}${ws_url}`; // Result: ws://localhost:8080/ws?job_id=xyz

      const socket = new WebSocket(fullWsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setStatus("processing");
      };

      socket.onmessage = async (event) => {
        try {
          const data: ProgressMessage = JSON.parse(event.data);

          if (data.type === "progress") {
            setProgress(data.progress);
            setMessage(data.message);
          } else if (data.type === "error") {
            setStatus("error");
            setMessage(data.message);
            cleanup();
          } else if (data.type === "complete") {
            setStatus("downloading");
            setMessage("Finalizing file...");
            cleanup(); // Close socket, we are done with updates

            // 3. Trigger final file download
            try {
              await triggerFileDownload(job_id, `playlist-${playlistId}.zip`);
              setStatus("complete");
              setMessage("Download finished!");
            } catch (err) {
              setStatus("error");
              setMessage("Failed to retrieve final file");
            }
          }
        } catch (e) {
          console.error("Failed to parse WS message", e);
        }
      };

      socket.onerror = () => {
        setStatus("error");
        setMessage("WebSocket connection failed");
        cleanup();
      };
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
      cleanup();
    }
  };

  return {
    startDownload,
    status,
    progress,
    message,
    reset: () => {
      cleanup();
      setStatus("idle");
      setProgress(0);
      setMessage("");
    },
  };
}
