import type { DownloadJobResponse, DownloadOptions } from "@/types/api";
import { api } from "./api";

/**
 * The Spotify resources that can be downloaded. Mirrors the backend `JobType`
 * union in `models/types.go`; each one exposes an identical
 * `POST /api/{type}/{id}/download` endpoint that returns a job.
 */
export type DownloadType = "playlist" | "album" | "track";

export async function initiateDownload(
  type: DownloadType,
  id: string,
  options?: DownloadOptions,
): Promise<DownloadJobResponse> {
  const response = await api.post<DownloadJobResponse>(
    `/api/${type}/${id}/download`,
    options,
  );
  return response.data;
}

/**
 * Builds the filename the browser saves the ZIP under. Prefers the resource's
 * own name (nicer for the user) and falls back to `{type}-{id}.zip`.
 */
export function buildDownloadFilename(
  type: DownloadType,
  id: string,
  name?: string,
): string {
  const slug = (name ?? "")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);

  return slug ? `${slug}.zip` : `${type}-${id}.zip`;
}

export async function triggerFileDownload(jobId: string, filename: string) {
  try {
    const response = await api.get(`/api/download/${jobId}`, {
      responseType: "blob",
    });

    // In Axios, the blob is found directly in response.data
    const blob = new Blob([response.data], { type: "application/zip" });
    const url = window.URL.createObjectURL(blob);

    // Create temporary link to trigger the browser download
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();

    // Cleanup
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed:", error);
    throw new Error("Failed to download file");
  }
}
