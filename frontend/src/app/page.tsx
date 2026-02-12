"use client";
import { api } from "@/lib/api";
import React, { useEffect, useState } from "react";

const HomePage = () => {
  const [data, setData] = useState<unknown>({});

  useEffect(() => {
    async function fetchData() {
      const res = await api.get("/api/playlist/06fAr3dCUFsMf5YBsvjaq8");
      console.log(res);
      setData(res.data);
    }
    void fetchData();
  }, []);

  return <div>{JSON.stringify(data)}</div>;
};

export default HomePage;
