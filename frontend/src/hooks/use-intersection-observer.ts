"use client";

import { useEffect, useRef, useState } from "react";

export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit,
) {
  const targetRef = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  const rootMargin = options?.rootMargin;
  const threshold = options?.threshold;

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setIsVisible(entry.isIntersecting);
      },
      { rootMargin, threshold },
    );

    observer.observe(target);
    return () => observer.disconnect();
    // Primitive deps rather than the options object, which callers usually
    // re-create inline on every render.
  }, [rootMargin, threshold]);

  return { targetRef, isVisible };
}
