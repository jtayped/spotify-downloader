import { env } from "@/env";
import axios from "axios";

const baseURL = 
  typeof window === "undefined" 
    ? env.API_URL       // Server-side? Use direct Go URL (http://localhost:8080)
    : "";               // Client-side? Use relative path (triggers Next.js rewrite)

export const api = axios.create({
  baseURL,
});