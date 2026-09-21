"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ArrowDownToLine } from "lucide-react";

import { Brand } from "@/components/shell/brand";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { UrlField, type UrlFieldHandle } from "@/components/url-field";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useDownloads } from "@/hooks/use-downloads";
import { cn } from "@/lib/utils";

function TopBar() {
  const pathname = usePathname();
  const { activeCount, jobs, togglePanel, isPanelOpen } = useDownloads();
  const fieldRef = React.useRef<UrlFieldHandle>(null);

  // The landing page already owns a full-size field; showing a second one in
  // the bar would be two controls competing for the same job.
  const showField = pathname !== "/";

  React.useEffect(() => {
    if (!showField) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        fieldRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showField]);

  return (
    <header className="border-line bg-canvas/85 sticky top-0 z-40 border-b backdrop-blur-md">
      {/* Below `sm` the field wraps to its own row rather than disappearing:
          the paste field is the only route to a new link, so it is present at
          every width. Above `sm` it sits inline and the bar stays 56px. */}
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:h-14 sm:flex-nowrap sm:py-0 sm:px-6">
        <Brand />

        {showField && (
          <div className="relative order-last w-full min-w-0 sm:order-none sm:ml-2 sm:w-auto sm:flex-1 md:max-w-md">
            <UrlField ref={fieldRef} variant="bar" />
            <kbd
              aria-hidden
              className="border-line bg-surface text-ink-subtle pointer-events-none absolute top-1/2 right-11 hidden -translate-y-1/2 rounded-xs border px-1.5 py-0.5 font-mono text-[10px] lg:block"
            >
              ⌘K
            </kbd>
          </div>
        )}

        <div
          className={cn(
            "flex items-center gap-1",
            showField ? "ml-auto sm:order-last sm:ml-0" : "ml-auto",
          )}
        >
          <Tooltip label={isPanelOpen ? "hide downloads" : "show downloads"}>
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePanel}
              aria-expanded={isPanelOpen}
              aria-controls="downloads-panel"
              className="gap-2"
            >
              <ArrowDownToLine />
              <span className="hidden sm:inline">downloads</span>
              {activeCount > 0 ? (
                <span className="bg-accent text-accent-ink tabular inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
                  {activeCount}
                </span>
              ) : jobs.length > 0 ? (
                <span className="text-ink-subtle tabular text-[11px]">
                  {jobs.length}
                </span>
              ) : null}
            </Button>
          </Tooltip>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export { TopBar };
