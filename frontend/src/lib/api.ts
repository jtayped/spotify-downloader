import { env } from "@/env";
import axios from "axios";

const baseURL =
  typeof window === "undefined"
    ? env.API_URL
    : "";

export const api = axios.create({
  baseURL,
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const url = error.config?.url;
      const data: unknown = error.response?.data;
      console.error(`[api] ${status ?? "network error"} ${url}`, data ?? error.message);
    } else {
      console.error("[api] unexpected error", error);
    }
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  },
);