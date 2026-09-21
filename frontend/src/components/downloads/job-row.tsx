"use client";

import {
  AlertCircle,
  CheckCircle2,
  Download,
  HelpCircle,
  X,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CoverArt } from "@/components/ui/cover-art";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip } from "@/components/ui/tooltip";
import { type DownloadJob, useDownloads } from "@/hooks/use-downloads";
import { TYPE_LABEL } from "@/lib/spotify";
import { cn } from "@/lib/utils";

function StatusIcon({ status }: { status: DownloadJob["status"] }) {
  if (status === "complete")
    return <CheckCircle2 className="text-accent-text size-4" aria-hidden />;
  if (status === "error")
    return <AlertCircle className="text-danger-text size-4" aria-hidden />;
  if (status === "unknown")
    return <HelpCircle className="text-ink-subtle size-4" aria-hidden />;
  return <Spinner className="text-accent size-4" />;
}

function JobRow({ job }: { job: DownloadJob }) {
  const { dismiss, saveFile } = useDownloads();
  const running =
    job.status === "starting" ||
    job.status === "running" ||
    job.status === "saving";

  return (
    <li className="border-line/70 group/job relative border-b px-4 py-3 last:border-b-0">
      <div className="flex gap-3">
        <CoverArt
          src={job.imageUrl}
          alt=""
          className="size-11"
          rounded="rounded-md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <Link
                href={`/${job.type}/${job.itemId}`}
                className="text-ink hover:text-accent-text block truncate text-[13px] font-medium"
              >
                {job.name}
              </Link>
              <p className="text-ink-subtle mt-0.5 text-[11px]">
                {TYPE_LABEL[job.type]}
              </p>
            </div>

            <Tooltip label="remove from list">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`remove ${job.name} from the download list`}
                onClick={() => dismiss(job.jobId)}
                className="opacity-0 transition-opacity group-hover/job:opacity-100 focus-visible:opacity-100"
              >
                <X />
              </Button>
            </Tooltip>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <StatusIcon status={job.status} />
            <p
              className={cn(
                "min-w-0 flex-1 truncate text-[12px]",
                job.status === "error" ? "text-danger-text" : "text-ink-muted",
              )}
            >
              {job.message}
            </p>
            {running && job.progress > 0 && (
              <span className="text-ink-muted tabular shrink-0 font-mono text-[11px]">
                {Math.round(job.progress)}%
              </span>
            )}
          </div>

          {running && (
            <Progress
              value={job.progress}
              indeterminate={job.status === "starting" || job.progress === 0}
              className="mt-2 h-1"
            />
          )}

          {(job.status === "unknown" || job.status === "error") && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-2.5 w-full"
              onClick={() => void saveFile(job.jobId)}
            >
              <Download />
              {job.status === "unknown" ? "try saving the file" : "retry save"}
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

export { JobRow };
