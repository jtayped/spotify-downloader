import { api } from "@/lib/api";
import React from "react";

const TrackPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const res = await api.get(`/api/track/${id}`);

  return <div>{JSON.stringify(res.data)}</div>;
};

export default TrackPage;
