"use client";

import * as React from "react";

import { env } from "@/env";
import {
  buildDownloadFilename,
  initiateDownload,
  triggerFileDownload,
  type DownloadType,
} from "@/lib/download-api";
import { readStore, writeStore } from "@/lib/storage";
import type { DownloadOptions, ProgressMessage } from "@/types/api";

const STORE_KEY = "sdl.jobs.v2";
const MAX_JOBS = 24;
/**
 * A job that finished while the tab was closed leaves no trace on the hub.
 * `ws.Hub` deletes the job key once its subscriber list empties, so a
 * reconnecting socket just waits forever. After this much silence we stop
 * pretending we know and offer a manual save instead.
 */
const REJOIN_SILENCE_MS = 10_000;

export type JobStatus =
  | "starting"
  | "running"
  | "saving"
  | "complete"
  | "error"
  | "unknown";

export interface DownloadJob {
  jobId: string;
  type: DownloadType;
  itemId: string;
  name: string;
  imageUrl?: string;
  status: JobStatus;
  progress: number;
  message: string;
  startedAt: number;
}

export interface StartDownloadInput {
  type: DownloadType;
  id: string;
  name: string;
  imageUrl?: string;
  options: DownloadOptions;
}

interface DownloadsContextValue {
  jobs: DownloadJob[];
  activeCount: number;
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  start: (input: StartDownloadInput) => Promise<void>;
  dismiss: (jobId: string) => void;
  clearFinished: () => void;
  saveFile: (jobId: string) => Promise<void>;
  /** Live status for one resource, so a page's button can reflect its own job. */
  jobFor: (type: DownloadType, itemId: string) => DownloadJob | undefined;
}

const DownloadsContext = React.createContext<DownloadsContextValue | null>(null);

const isActive = (status: JobStatus) =>
  status === "starting" || status === "running" || status === "saving";

function wsUrlFor(jobId: string): string {
  // Dev: NEXT_PUBLIC_WS_URL points straight at the Go backend, because Next.js
  // rewrites proxy HTTP but not WebSocket upgrades. Prod: unset, so we use the
  // page origin and Nginx performs the upgrade.
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const base = env.NEXT_PUBLIC_WS_URL ?? `${protocol}//${window.location.host}`;
  return `${base}/api/ws?job_id=${jobId}`;
}

export function DownloadsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = React.useState<DownloadJob[]>([]);
  const [isPanelOpen, setPanelOpen] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  const sockets = React.useRef(new Map<string, WebSocket>());
  const timers = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const patch = React.useCallback(
    (jobId: string, changes: Partial<DownloadJob>) => {
      setJobs((current) =>
        current.map((job) =>
          job.jobId === jobId ? { ...job, ...changes } : job,
        ),
      );
    },
    [],
  );

  const closeSocket = React.useCallback((jobId: string) => {
    sockets.current.get(jobId)?.close();
    sockets.current.delete(jobId);
    const timer = timers.current.get(jobId);
    if (timer) clearTimeout(timer);
    timers.current.delete(jobId);
  }, []);

  const saveFile = React.useCallback(
    async (jobId: string) => {
      const job = jobs.find((item) => item.jobId === jobId);
      if (!job) return;

      patch(jobId, { status: "saving", message: "saving file…" });
      try {
        await triggerFileDownload(
          jobId,
          buildDownloadFilename(job.type, job.itemId, job.name),
        );
        patch(jobId, {
          status: "complete",
          progress: 100,
          message: "saved to your downloads",
        });
      } catch {
        patch(jobId, {
          status: "error",
          message:
            "the archive is no longer on the server. start the download again.",
        });
      }
    },
    [jobs, patch],
  );

  // `saveFile` closes over `jobs`; the socket handlers below are created once
  // per job, so they read the latest version through a ref instead.
  const saveFileRef = React.useRef(saveFile);
  React.useEffect(() => {
    saveFileRef.current = saveFile;
  }, [saveFile]);

  const connect = React.useCallback(
    (job: DownloadJob, { rejoining }: { rejoining: boolean }) => {
      if (sockets.current.has(job.jobId)) return;

      let socket: WebSocket;
      try {
        socket = new WebSocket(wsUrlFor(job.jobId));
      } catch {
        patch(job.jobId, {
          status: "error",
          message: "could not open a progress connection.",
        });
        return;
      }
      sockets.current.set(job.jobId, socket);

      const armSilenceTimer = () => {
        if (!rejoining) return;
        const existing = timers.current.get(job.jobId);
        if (existing) clearTimeout(existing);
        timers.current.set(
          job.jobId,
          setTimeout(() => {
            closeSocket(job.jobId);
            patch(job.jobId, {
              status: "unknown",
              message: "lost track of this job while the tab was closed.",
            });
          }, REJOIN_SILENCE_MS),
        );
      };

      socket.onopen = () => {
        patch(job.jobId, {
          status: "running",
          message: rejoining ? "reconnecting…" : "working…",
        });
        armSilenceTimer();
      };

      socket.onmessage = (event) => {
        armSilenceTimer();
        let data: ProgressMessage;
        try {
          data = JSON.parse(event.data as string) as ProgressMessage;
        } catch {
          return;
        }

        if (data.type === "progress") {
          patch(job.jobId, {
            status: "running",
            progress: data.progress,
            message: data.message,
          });
          return;
        }

        if (data.type === "error") {
          closeSocket(job.jobId);
          patch(job.jobId, {
            status: "error",
            message: data.message || "the download failed.",
          });
          return;
        }

        if (data.type === "complete") {
          closeSocket(job.jobId);
          patch(job.jobId, { progress: 100 });
          void saveFileRef.current(job.jobId);
        }
      };

      socket.onerror = () => {
        patch(job.jobId, {
          status: "error",
          message: "lost the connection to the server.",
        });
      };

      socket.onclose = () => {
        sockets.current.delete(job.jobId);
      };
    },
    [closeSocket, patch],
  );

  // Rehydrate on mount and rejoin anything that was still in flight.
  React.useEffect(() => {
    const stored = readStore<DownloadJob[]>(STORE_KEY, []);
    const restored = stored.map((job) =>
      isActive(job.status)
        ? { ...job, status: "running" as JobStatus, message: "reconnecting…" }
        : job,
    );
    setJobs(restored);
    setHydrated(true);

    for (const job of restored) {
      if (isActive(job.status)) connect(job, { rejoining: true });
    }
    // `connect` is stable and this must run exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (hydrated) writeStore(STORE_KEY, jobs);
  }, [jobs, hydrated]);

  // Close every socket when the provider unmounts.
  React.useEffect(() => {
    const open = sockets.current;
    const pending = timers.current;
    return () => {
      open.forEach((socket) => socket.close());
      open.clear();
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const start = React.useCallback(
    async (input: StartDownloadInput) => {
      const placeholderId = `pending-${Date.now()}`;
      const placeholder: DownloadJob = {
        jobId: placeholderId,
        type: input.type,
        itemId: input.id,
        name: input.name,
        imageUrl: input.imageUrl,
        status: "starting",
        progress: 0,
        message: "queueing…",
        startedAt: Date.now(),
      };

      setJobs((current) => [placeholder, ...current].slice(0, MAX_JOBS));
      setPanelOpen(true);

      try {
        const { job_id } = await initiateDownload(
          input.type,
          input.id,
          input.options,
        );

        const job: DownloadJob = { ...placeholder, jobId: job_id };
        setJobs((current) =>
          current.map((item) => (item.jobId === placeholderId ? job : item)),
        );
        connect(job, { rejoining: false });
      } catch (error) {
        setJobs((current) =>
          current.map((item) =>
            item.jobId === placeholderId
              ? {
                  ...item,
                  status: "error",
                  message:
                    error instanceof Error
                      ? error.message
                      : "could not start the download.",
                }
              : item,
          ),
        );
      }
    },
    [connect],
  );

  const dismiss = React.useCallback(
    (jobId: string) => {
      closeSocket(jobId);
      setJobs((current) => current.filter((job) => job.jobId !== jobId));
    },
    [closeSocket],
  );

  const clearFinished = React.useCallback(() => {
    setJobs((current) => current.filter((job) => isActive(job.status)));
  }, []);

  const jobFor = React.useCallback(
    (type: DownloadType, itemId: string) =>
      jobs.find((job) => job.type === type && job.itemId === itemId),
    [jobs],
  );

  const activeCount = jobs.filter((job) => isActive(job.status)).length;

  const value = React.useMemo<DownloadsContextValue>(
    () => ({
      jobs,
      activeCount,
      isPanelOpen,
      openPanel: () => setPanelOpen(true),
      closePanel: () => setPanelOpen(false),
      togglePanel: () => setPanelOpen((open) => !open),
      start,
      dismiss,
      clearFinished,
      saveFile,
      jobFor,
    }),
    [
      jobs,
      activeCount,
      isPanelOpen,
      start,
      dismiss,
      clearFinished,
      saveFile,
      jobFor,
    ],
  );

  return (
    <DownloadsContext.Provider value={value}>
      {children}
    </DownloadsContext.Provider>
  );
}

export function useDownloads(): DownloadsContextValue {
  const context = React.useContext(DownloadsContext);
  if (!context) {
    throw new Error("useDownloads must be used inside <DownloadsProvider>");
  }
  return context;
}

export { isActive as isJobActive };
