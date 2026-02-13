import { api } from "@/lib/api";
import { catchError } from "@/lib/error-handling";
import type { TrackDetailsDTO } from "@/types/api";
import { notFound } from "next/navigation";
import React from "react";

async function fetchTrack(id: string) {
  const response = await api.get<TrackDetailsDTO>(`/api/track/${id}`);
  return response.data;
}

const TrackPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const [error, track] = await catchError(fetchTrack(id));
  if (error) return notFound();

  return <div>{JSON.stringify(track)}</div>;
};

export default TrackPage;
