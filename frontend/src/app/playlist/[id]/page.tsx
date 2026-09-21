import axios from "axios";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { PlaylistView } from "@/components/collection/playlist-view";
import { api } from "@/lib/api";
import { catchError } from "@/lib/error-handling";
import type { PlaylistResponse } from "@/types/api";

async function fetchPlaylist(id: string) {
  const response = await api.get<PlaylistResponse>(`/api/playlist/${id}`);
  return response.data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [error, playlist] = await catchError(fetchPlaylist(id));
  if (error) return { title: "playlist" };
  return { title: playlist.metadata?.name ?? "playlist" };
}

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [error, playlist] = await catchError(fetchPlaylist(id));
  if (error) {
    console.error(`[playlist/${id}] fetch failed:`, error);
    if (axios.isAxiosError(error) && error.response?.status === 404) notFound();
    throw error;
  }

  return <PlaylistView playlist={playlist} />;
}
