import type { DownloadJobResponse } from "@/types/api";
import { api } from "./api";

export async function initiateDownload(
  playlistId: string,
): Promise<{ job_id: string; ws_url: string }> {
  const response = await api.post<DownloadJobResponse>(
    `/api/playlist/${playlistId}/download`,
  );
  return response.data;
}

export async function triggerFileDownload(jobId: string, filename: string) {
  try {
    const response = await api.get(`/download/${jobId}`, {
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
