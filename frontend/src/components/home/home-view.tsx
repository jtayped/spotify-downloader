"use client";

import Link from "next/link";
import { Clock3, X } from "lucide-react";

import { UrlField } from "@/components/url-field";
import { Button } from "@/components/ui/button";
import { CoverArt } from "@/components/ui/cover-art";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { useRecent } from "@/hooks/use-recent";
import { TYPE_LABEL } from "@/lib/spotify";

function RecentSection() {
  const { items, hydrated, forget, clear } = useRecent();

  if (!hydrated) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="recent-heading" className="animate-rise">
      <div className="mb-3 flex items-center gap-2">
        <Clock3 className="text-ink-subtle size-3.5" aria-hidden />
        <h2
          id="recent-heading"
          className="text-ink-muted flex-1 text-[12px] font-medium"
        >
          recently opened
        </h2>
        <Button variant="ghost" size="sm" onClick={clear}>
          clear
        </Button>
      </div>

      <ul className="border-line divide-line/70 divide-y overflow-hidden rounded-xl border">
        {items.map((item) => (
          <li key={`${item.type}-${item.id}`} className="group/recent relative">
            <Link
              href={`/${item.type}/${item.id}`}
              className="hover:bg-surface flex items-center gap-3 px-3 py-2.5 transition-colors duration-100"
            >
              <CoverArt
                src={item.imageUrl}
                alt=""
                className="size-10"
                rounded="rounded-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-ink truncate text-[13px] font-medium">
                  {item.name}
                </p>
                <p className="text-ink-muted truncate text-[12px]">
                  {TYPE_LABEL[item.type]} · {item.subtitle}
                </p>
              </div>
            </Link>

            <Tooltip label="remove">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`remove ${item.name} from recently opened`}
                onClick={() => forget(item.type, item.id)}
                className="absolute top-1/2 right-2 -translate-y-1/2 opacity-0 transition-opacity group-hover/recent:opacity-100 focus-visible:opacity-100"
              >
                <X />
              </Button>
            </Tooltip>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HomeView() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <div className="space-y-8">
        <div className="space-y-3">
          <h1 className="text-ink text-4xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
            paste a link, keep the music.
          </h1>
          <p className="text-ink-muted max-w-[52ch] text-[15px] leading-relaxed">
            tracks, albums and playlists from spotify, downloaded as tagged
            mp3s with cover art. downloads keep running while you queue up the
            next one.
          </p>
        </div>

        <UrlField variant="hero" autoFocus />

        <RecentSection />
      </div>
    </div>
  );
}

export { HomeView };
