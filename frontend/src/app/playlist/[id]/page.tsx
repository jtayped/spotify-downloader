"use server";
import { api } from "@/lib/api";
import { catchError } from "@/lib/error-handling";
import type { PlaylistMetadata } from "@/types/api";
import { notFound } from "next/navigation";
import React from "react";

async function fetchPlaylist(id: string) {
  const response = await api.get<PlaylistMetadata>(`/api/playlist/${id}`);
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

  return <div>{JSON.stringify(playlist)}</div>;
};

export default PlaylistPage;
