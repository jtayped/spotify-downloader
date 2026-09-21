"use client";

import { ExternalLink } from "lucide-react";

import { DownloadButton } from "@/components/downloads/download-button";
import { Button } from "@/components/ui/button";
import { CoverArt } from "@/components/ui/cover-art";
import type { DownloadType } from "@/lib/download-api";

/**
 * Shared masthead for playlist and album pages. The resource type lives in the
 * metadata line under the title, never as a label above it.
 */
function CollectionHeader({
  type,
  id,
  title,
  byline,
  meta,
  description,
  imageUrl,
  externalUrl,
}: {
  type: DownloadType;
  id: string;
  title: string;
  byline?: React.ReactNode;
  meta: string[];
  description?: string;
  imageUrl?: string;
  externalUrl?: string;
}) {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
      <CoverArt
        src={imageUrl}
        alt={`cover art for ${title}`}
        priority
        rounded="rounded-xl"
        className="shadow-art size-40 sm:size-48 lg:size-56"
      />

      <div className="min-w-0 flex-1 space-y-4">
        <div className="space-y-2">
          <h1 className="text-ink text-3xl leading-[1.1] font-semibold tracking-[-0.025em] text-balance sm:text-4xl lg:text-[2.75rem]">
            {title}
          </h1>

          {byline && (
            <p className="text-ink text-[15px] font-medium">{byline}</p>
          )}

          <p className="text-ink-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
            {meta.map((item, index) => (
              <span key={item} className="flex items-center gap-2">
                {index > 0 && (
                  <span className="text-ink-subtle" aria-hidden>
                    ·
                  </span>
                )}
                <span className="tabular">{item}</span>
              </span>
            ))}
          </p>
        </div>

        {description && (
          <p className="text-ink-muted max-w-[65ch] text-[13px] leading-relaxed">
            {description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <DownloadButton
            type={type}
            id={id}
            name={title}
            imageUrl={imageUrl}
          />
          {externalUrl && (
            <Button variant="ghost" size="lg" asChild>
              <a href={externalUrl} target="_blank" rel="noreferrer noopener">
                open in spotify
                <ExternalLink />
              </a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export { CollectionHeader };
