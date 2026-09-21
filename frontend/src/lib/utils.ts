import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** `213000` → `3:33`. Used for every track duration in the UI. */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0:00";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Aggregate runtime, e.g. `1 hr 12 min` or `41 min`. */
export function formatTotalDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}

/**
 * Spotify release dates arrive at varying precision (`2019`, `2019-04`,
 * `2019-04-26`), so render only what the string actually claims.
 */
export function formatReleaseDate(value: string): string {
  if (!value) return "";
  const parts = value.split("-");
  if (parts.length === 1) return parts[0]!;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      ...(parts.length >= 3 ? { day: "numeric" } : {}),
    })
    .toLowerCase();
}

export function releaseYear(value: string): string {
  return value?.slice(0, 4) ?? "";
}

export function formatDate(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toLowerCase();
}

/** `1730` → `1.7 KB`; used for downloaded file sizes when the server reports one. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "unknown";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function joinArtists(artists: { name: string }[] | undefined): string {
  return (artists ?? []).map((artist) => artist.name).join(", ");
}
