import { api } from "@/lib/api";
import { catchError } from "@/lib/error-handling";
import { notFound } from "next/navigation";
import React from "react";

const TrackPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const [error, res] = await catchError(api.get(`/api/track/${id}`));
  if (error) return notFound();

  return <div>{JSON.stringify(res.data)}</div>;
};

export default TrackPage;
