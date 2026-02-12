"use server";
import { api } from "@/lib/api";
import React from "react";

const HomePage = async () => {
  const res = await api.get("/api/playlist/06fAr3dCUFsMf5YBsvjaq8");

  return <div>{JSON.stringify(res.data)}</div>;
};

export default HomePage;
