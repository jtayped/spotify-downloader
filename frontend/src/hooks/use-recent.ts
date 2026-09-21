"use client";

import { useCallback, useEffect, useState } from "react";

import type { DownloadType } from "@/lib/download-api";
import { readStore, writeStore } from "@/lib/storage";

const STORE_KEY = "sdl.recent.v1";
const MAX_RECENT = 8;

export interface RecentItem {
  type: DownloadType;
  id: string;
  name: string;
  subtitle: string;
  imageUrl?: string;
  openedAt: number;
}

/**
 * Recently opened resources, kept per-browser. Gives the landing page real
 * substance for a returning user instead of an empty hero.
 */
export function useRecent() {
  const [items, setItems] = useState<RecentItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStore<RecentItem[]>(STORE_KEY, []));
    setHydrated(true);
  }, []);

  const remember = useCallback((item: Omit<RecentItem, "openedAt">) => {
    setItems((current) => {
      const next = [
        { ...item, openedAt: Date.now() },
        ...current.filter(
          (entry) => !(entry.type === item.type && entry.id === item.id),
        ),
      ].slice(0, MAX_RECENT);
      writeStore(STORE_KEY, next);
      return next;
    });
  }, []);

  const forget = useCallback((type: DownloadType, id: string) => {
    setItems((current) => {
      const next = current.filter(
        (entry) => !(entry.type === type && entry.id === id),
      );
      writeStore(STORE_KEY, next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    writeStore(STORE_KEY, []);
  }, []);

  return { items, hydrated, remember, forget, clear };
}
