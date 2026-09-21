"use client";

import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import type { DownloadType } from "@/lib/download-api";
import type { DownloadOptions } from "@/types/api";

// tygo emits the named Go enums as bare `string` aliases, so the literal
// unions on DownloadOptions itself are the only precise types available.
type AudioFormat = DownloadOptions["format"];
type AudioQuality = DownloadOptions["quality"];
type CoverMode = DownloadOptions["coverMode"];

export const DEFAULT_OPTIONS: DownloadOptions = {
  format: "mp3",
  quality: "high",
  coverMode: "embedded",
  includeM3u: false,
};

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-ink block text-[12px] font-medium">{label}</label>
      {children}
      <p className="text-ink-subtle text-[11px] leading-snug">{hint}</p>
    </div>
  );
}

/**
 * Mirrors `models.DownloadOptions` exactly. Quality and cover mode are
 * meaningless for `original` (no re-encode, no tagging pass), and cover mode
 * only applies to albums, where every track already shares one cover.
 */
function DownloadOptionsForm({
  type,
  value,
  onChange,
}: {
  type: DownloadType;
  value: DownloadOptions;
  onChange: (next: DownloadOptions) => void;
}) {
  const isOriginal = value.format === "original";
  const set = (patch: Partial<DownloadOptions>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <Row
        label="format"
        hint={
          isOriginal
            ? "whatever codec youtube served, untagged. faster, but no metadata or cover art."
            : "re-encoded to mp3 and tagged with spotify metadata and cover art."
        }
      >
        <Segmented<AudioFormat>
          label="audio format"
          value={value.format}
          onChange={(format) => set({ format })}
          options={[
            { value: "mp3", label: "mp3" },
            { value: "original", label: "original" },
          ]}
        />
      </Row>

      <Row
        label="quality"
        hint={
          isOriginal
            ? "not applicable. the original file is copied as it arrives."
            : "best takes whatever the source offers. youtube audio rarely goes past ~160 kbps."
        }
      >
        <Segmented<AudioQuality>
          label="audio quality"
          value={value.quality}
          disabled={isOriginal}
          onChange={(quality) => set({ quality })}
          options={[
            { value: "low", label: "96k" },
            { value: "medium", label: "128k" },
            { value: "high", label: "best" },
          ]}
        />
      </Row>

      {type === "album" && (
        <Row
          label="cover art"
          hint={
            isOriginal
              ? "not applicable. original files are not tagged."
              : "folder writes one shared cover.jpg beside the tracks instead of embedding it in every file."
          }
        >
          <Segmented<CoverMode>
            label="cover art placement"
            value={value.coverMode}
            disabled={isOriginal}
            onChange={(coverMode) => set({ coverMode })}
            options={[
              { value: "embedded", label: "embedded" },
              { value: "folder", label: "folder" },
            ]}
          />
        </Row>
      )}

      {type !== "track" && (
        <div className="border-line flex items-start justify-between gap-3 border-t pt-4">
          <div className="min-w-0">
            <label
              htmlFor="include-m3u"
              className="text-ink block text-[12px] font-medium"
            >
              include playlist.m3u8
            </label>
            <p className="text-ink-subtle mt-1 text-[11px] leading-snug">
              adds an extended m3u file that keeps the original track order.
            </p>
          </div>
          <Switch
            id="include-m3u"
            checked={value.includeM3u}
            onCheckedChange={(includeM3u) => set({ includeM3u })}
          />
        </div>
      )}
    </div>
  );
}

export { DownloadOptionsForm };
