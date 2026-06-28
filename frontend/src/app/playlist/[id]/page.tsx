"use server";
import PlaylistView from "@/components/playlist";
import { api } from "@/lib/api";
import { catchError } from "@/lib/error-handling";
import type { PlaylistResponse } from "@/types/api";
import axios from "axios";
import { notFound } from "next/navigation";
import React from "react";

async function fetchPlaylist(id: string) {
  const response = await api.get<PlaylistResponse>(`/api/playlist/${id}`);
  return response.data;
}

const PlaylistPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const [error, playlist] = await catchError(fetchPlaylist(id));
  if (error) {
    console.error(`[playlist/${id}] fetch failed:`, error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return notFound();
    }
    throw error;
  }

  return <PlaylistView playlist={playlist} />;
};

export default PlaylistPage;
