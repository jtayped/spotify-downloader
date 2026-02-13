"use server";
import PlaylistView from "@/components/playlist";
import { api } from "@/lib/api";
import { catchError } from "@/lib/error-handling";
import type { PlaylistResponse } from "@/types/api";
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
  if (error) return notFound();

  return <PlaylistView playlist={playlist} />;
};

export default PlaylistPage;
