"use client";

import * as React from "react";
import { ArrowDownToLine, X } from "lucide-react";

import { JobRow } from "@/components/downloads/job-row";
import { Button } from "@/components/ui/button";
import { isJobActive, useDownloads } from "@/hooks/use-downloads";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

/**
 * Persistent job panel. On desktop it sits beside the page without stealing
 * focus, so a download can run while the user keeps browsing; below `lg` it
 * becomes a modal sheet, because there is no room to do both at once.
 */
function DownloadsDock() {
  const { jobs, isPanelOpen, closePanel, clearFinished } = useDownloads();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const panelRef = React.useRef<HTMLDivElement>(null);
  const restoreFocusRef = React.useRef<HTMLElement | null>(null);

  const finishedCount = jobs.filter((job) => !isJobActive(job.status)).length;

  React.useEffect(() => {
    if (!isPanelOpen) return;

    if (!isDesktop) {
      restoreFocusRef.current = document.activeElement as HTMLElement | null;
      panelRef.current?.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (!isDesktop) restoreFocusRef.current?.focus();
    };
  }, [isPanelOpen, isDesktop, closePanel]);

  // Mobile keeps the page from scrolling behind the sheet.
  React.useEffect(() => {
    if (isPanelOpen && !isDesktop) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [isPanelOpen, isDesktop]);

  return (
    <>
      {isPanelOpen && !isDesktop && (
        <button
          type="button"
          aria-label="close downloads"
          onClick={closePanel}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        id="downloads-panel"
        ref={panelRef}
        tabIndex={-1}
        aria-label="downloads"
        // `inert` removes the closed panel from the tab order and the
        // accessibility tree together. `aria-hidden` alone would hide it from
        // screen readers while leaving its buttons reachable by keyboard.
        inert={!isPanelOpen}
        role={isDesktop ? "complementary" : "dialog"}
        aria-modal={!isDesktop && isPanelOpen ? true : undefined}
        className={cn(
          "border-line bg-canvas fixed z-50 flex flex-col border-l outline-none",
          "top-0 right-0 h-dvh w-full max-w-[380px]",
          "transition-transform duration-200 ease-out",
          "lg:shadow-float",
          isPanelOpen
            ? "translate-x-0"
            : "pointer-events-none translate-x-full",
        )}
      >
        <div className="border-line flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <h2 className="text-ink flex-1 text-[13px] font-semibold">
            downloads
          </h2>
          {finishedCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFinished}>
              clear finished
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="close downloads"
            onClick={closePanel}
          >
            <X />
          </Button>
        </div>

        {jobs.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <div className="bg-surface border-line text-ink-subtle flex size-11 items-center justify-center rounded-full border">
              <ArrowDownToLine className="size-[18px]" aria-hidden />
            </div>
            <p className="text-ink text-[13px] font-medium">
              no downloads yet
            </p>
            <p className="text-ink-muted text-[12px] leading-relaxed">
              open a track, album or playlist and start one. jobs keep running
              here while you browse, and survive a page reload.
            </p>
          </div>
        ) : (
          <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {jobs.map((job) => (
              <JobRow key={job.jobId} job={job} />
            ))}
          </ul>
        )}
      </aside>
    </>
  );
}

export { DownloadsDock };
