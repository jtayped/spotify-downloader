import TrackView from "@/components/track";
import { api } from "@/lib/api";
import { catchError } from "@/lib/error-handling";
import type { TrackDetailsDTO } from "@/types/api";
import axios from "axios";
import { notFound } from "next/navigation";
import React from "react";

async function fetchTrack(id: string) {
  const response = await api.get<TrackDetailsDTO>(`/api/track/${id}`);
  return response.data;
}

const TrackPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const [error, track] = await catchError(fetchTrack(id));
  if (error) {
    console.error(`[track/${id}] fetch failed:`, error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return notFound();
    }
    throw error;
  }

  return <TrackView track={track} />;
};

export default TrackPage;
