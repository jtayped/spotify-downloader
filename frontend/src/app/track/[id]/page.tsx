import axios from "axios";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { TrackView } from "@/components/track/track-view";
import { api } from "@/lib/api";
import { catchError } from "@/lib/error-handling";
import type { TrackDetailsDTO } from "@/types/api";

async function fetchTrack(id: string) {
  const response = await api.get<TrackDetailsDTO>(`/api/track/${id}`);
  return response.data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [error, track] = await catchError(fetchTrack(id));
  if (error) return { title: "track" };
  return { title: track.name };
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [error, track] = await catchError(fetchTrack(id));
  if (error) {
    console.error(`[track/${id}] fetch failed:`, error);
    if (axios.isAxiosError(error) && error.response?.status === 404) notFound();
    throw error;
  }

  return <TrackView track={track} />;
}
