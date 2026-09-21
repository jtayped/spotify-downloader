import axios from "axios";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { AlbumView } from "@/components/collection/album-view";
import { api } from "@/lib/api";
import { catchError } from "@/lib/error-handling";
import type { AlbumResponse } from "@/types/api";

async function fetchAlbum(id: string) {
  const response = await api.get<AlbumResponse>(`/api/album/${id}`);
  return response.data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [error, album] = await catchError(fetchAlbum(id));
  if (error) return { title: "album" };
  return { title: album.metadata?.name ?? "album" };
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [error, album] = await catchError(fetchAlbum(id));
  if (error) {
    console.error(`[album/${id}] fetch failed:`, error);
    if (axios.isAxiosError(error) && error.response?.status === 404) notFound();
    throw error;
  }

  return <AlbumView album={album} />;
}
