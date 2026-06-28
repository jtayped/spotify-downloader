import { env } from "@/env";
import axios from "axios";

const baseURL = 
  typeof window === "undefined" 
    ? env.API_URL
    : "";

export const api = axios.create({
  baseURL,
});