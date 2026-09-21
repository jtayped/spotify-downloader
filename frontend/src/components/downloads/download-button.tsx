"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Settings2,
} from "lucide-react";

import {
  DEFAULT_OPTIONS,
  DownloadOptionsForm,
} from "@/components/downloads/download-options-form";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip } from "@/components/ui/tooltip";
import { useDownloads } from "@/hooks/use-downloads";
import type { DownloadType } from "@/lib/download-api";
import { readStore, writeStore } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { DownloadOptions } from "@/types/api";

const OPTIONS_KEY = "sdl.options.v1";

/**
 * Primary action on every resource page. Option choices persist per browser,
 * because a user who wants 128k MP3s wants them every time.
 */
function DownloadButton({
  type,
  id,
  name,
  imageUrl,
  size = "lg",
  className,
}: {
  type: DownloadType;
  id: string;
  name: string;
  imageUrl?: string;
  size?: "md" | "lg";
  className?: string;
}) {
  const { start, jobFor, openPanel } = useDownloads();
  const [options, setOptions] = React.useState<DownloadOptions>(DEFAULT_OPTIONS);

  React.useEffect(() => {
    setOptions(readStore<DownloadOptions>(OPTIONS_KEY, DEFAULT_OPTIONS));
  }, []);

  const updateOptions = (next: DownloadOptions) => {
    setOptions(next);
    writeStore(OPTIONS_KEY, next);
  };

  const job = jobFor(type, id);
  const running =
    job?.status === "starting" ||
    job?.status === "running" ||
    job?.status === "saving";

  const label = running
    ? job.status === "saving"
      ? "saving…"
      : job.progress > 0
        ? `${Math.round(job.progress)}%`
        : "starting…"
    : job?.status === "complete"
      ? "download again"
      : job?.status === "error"
        ? "try again"
        : "download";

  const Icon = running
    ? null
    : job?.status === "complete"
      ? CheckCircle2
      : job?.status === "error"
        ? AlertCircle
        : Download;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="primary"
        size={size}
        onClick={() => {
          if (running) {
            openPanel();
            return;
          }
          void start({ type, id, name, imageUrl, options });
        }}
        aria-label={
          running
            ? `download in progress, ${Math.round(job.progress)} percent. open the downloads panel`
            : `download ${name}`
        }
        className="min-w-[9.5rem]"
      >
        {running ? <Spinner className="size-4" /> : Icon && <Icon />}
        {label}
      </Button>

      <Popover>
        <Tooltip label="download options">
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              size={size === "lg" ? "icon-lg" : "icon"}
              aria-label="download options"
            >
              <Settings2 />
            </Button>
          </PopoverTrigger>
        </Tooltip>
        <PopoverContent className="w-80">
          <p className="text-ink mb-4 text-[13px] font-semibold">
            download options
          </p>
          <DownloadOptionsForm
            type={type}
            value={options}
            onChange={updateOptions}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { DownloadButton };
