"use client";

import { DownloadsDock } from "@/components/downloads/downloads-dock";
import { NowPlayingBar } from "@/components/player/now-playing-bar";
import { TopBar } from "@/components/shell/top-bar";
import { useDownloads } from "@/hooks/use-downloads";
import { cn } from "@/lib/utils";

function AppShell({ children }: { children: React.ReactNode }) {
  const { isPanelOpen } = useDownloads();

  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col",
        // At `lg` and up the panel genuinely docks: the page yields a gutter
        // rather than being covered, so a running job never hides the
        // tracklist behind it. Below `lg` it overlays as a sheet.
        "lg:transition-[padding-right] lg:duration-200 lg:ease-out",
        isPanelOpen && "lg:pr-[380px]",
      )}
    >
      <a
        href="#main"
        className="bg-accent text-accent-ink sr-only rounded-md px-3 py-2 text-[13px] font-medium focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60]"
      >
        skip to content
      </a>

      <TopBar />

      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>

      <NowPlayingBar />
      <DownloadsDock />
    </div>
  );
}

export { AppShell };
