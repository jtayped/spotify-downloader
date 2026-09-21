"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ClipboardPaste,
  Disc3,
  Link2,
  ListMusic,
  Music2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import type { DownloadType } from "@/lib/download-api";
import { parseSpotifyRef, TYPE_LABEL } from "@/lib/spotify";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<DownloadType, typeof Music2> = {
  track: Music2,
  album: Disc3,
  playlist: ListMusic,
};

export interface UrlFieldHandle {
  focus: () => void;
}

/**
 * The one way into the app. `hero` is the landing-page control; `bar` is the
 * persistent copy in the top bar so a link can be opened from any page.
 */
const UrlField = React.forwardRef<
  UrlFieldHandle,
  { variant?: "hero" | "bar"; className?: string; autoFocus?: boolean }
>(function UrlField({ variant = "hero", className, autoFocus }, ref) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [value, setValue] = React.useState("");
  const [touched, setTouched] = React.useState(false);

  React.useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  const parsed = parseSpotifyRef(value);
  const status = !value.trim() ? "empty" : parsed ? "valid" : "invalid";
  const showError = status === "invalid" && touched;
  const isHero = variant === "hero";

  const submit = () => {
    setTouched(true);
    if (!parsed) {
      inputRef.current?.focus();
      return;
    }
    router.push(`/${parsed.type}/${parsed.id}`);
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      setValue(text);
      setTouched(true);
      const ref = parseSpotifyRef(text);
      if (ref) router.push(`/${ref.type}/${ref.id}`);
    } catch {
      // Clipboard permission denied. The user can still type or paste manually.
      inputRef.current?.focus();
    }
  };

  const TypeIcon = parsed ? TYPE_ICON[parsed.type] : Link2;

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className={cn(
          "bg-surface border-line flex w-full items-center gap-2 border transition-[border-color,background-color] duration-150 ease-out",
          "focus-within:border-accent focus-within:bg-canvas",
          isHero ? "h-13 rounded-xl px-3" : "h-9 rounded-md px-2.5",
          showError && "border-danger/60",
          !showError && "hover:border-line-strong",
        )}
      >
        <TypeIcon
          aria-hidden
          className={cn(
            "shrink-0 transition-colors duration-150",
            isHero ? "size-[18px]" : "size-4",
            status === "valid" ? "text-accent-text" : "text-ink-subtle",
          )}
        />

        <input
          ref={inputRef}
          type="url"
          inputMode="url"
          autoFocus={autoFocus}
          spellCheck={false}
          autoComplete="off"
          value={value}
          aria-label="spotify link"
          aria-invalid={showError || undefined}
          aria-describedby={showError ? "url-field-error" : undefined}
          placeholder={
            isHero
              ? "paste a spotify track, album or playlist link"
              : "paste a spotify link"
          }
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => setTouched(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
            if (event.key === "Escape") {
              setValue("");
              setTouched(false);
            }
          }}
          className={cn(
            "text-ink placeholder:text-ink-subtle min-w-0 flex-1 bg-transparent outline-none",
            isHero ? "text-[15px]" : "text-[13px]",
          )}
        />

        {value ? (
          <>
            {status === "valid" ? (
              <Check
                className="text-accent-text size-4 shrink-0"
                aria-hidden
              />
            ) : (
              <X className="text-danger-text size-4 shrink-0" aria-hidden />
            )}
            <Tooltip label="clear">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="clear the link"
                onClick={() => {
                  setValue("");
                  setTouched(false);
                  inputRef.current?.focus();
                }}
              >
                <X />
              </Button>
            </Tooltip>
          </>
        ) : (
          <Tooltip label="paste from clipboard">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="paste from clipboard"
              onClick={paste}
            >
              <ClipboardPaste />
            </Button>
          </Tooltip>
        )}

        {isHero && (
          <Button
            variant="primary"
            size="md"
            onClick={submit}
            disabled={status !== "valid"}
            className="shrink-0"
          >
            open
            <ArrowRight />
          </Button>
        )}
      </div>

      {/* The bar variant is the only way into the app below `sm`, so it needs
          the same named problem the hero gives. It is positioned out of flow so
          the 56px top bar keeps its height on desktop. Both branches render the
          same id, so `aria-describedby` never dangles. */}
      {!isHero && showError && (
        <span
          id="url-field-error"
          role="alert"
          className="border-line bg-overlay text-danger-text shadow-float absolute top-full right-0 left-0 z-20 mt-1.5 rounded-md border px-2.5 py-1.5 text-[12px]"
        >
          that is not a spotify track, album or playlist link.
        </span>
      )}

      {isHero && (
        <div className="mt-2.5 flex min-h-5 items-center gap-2 text-[12px]">
          {status === "valid" && parsed ? (
            <span className="text-ink-muted animate-rise flex items-center gap-1.5">
              <Check className="text-accent-text size-3.5" aria-hidden />
              {TYPE_LABEL[parsed.type]} link found. press
              <kbd className="border-line bg-surface text-ink-muted rounded-xs border px-1 font-mono text-[10px]">
                ↵
              </kbd>
              to open
            </span>
          ) : showError ? (
            <span id="url-field-error" className="text-danger-text">
              that is not a spotify track, album or playlist link.
            </span>
          ) : (
            <span className="text-ink-subtle">
              works with share links, locale links and{" "}
              <span className="font-mono text-[11px]">spotify:</span> uris.
            </span>
          )}
        </div>
      )}
    </div>
  );
});

export { UrlField };
