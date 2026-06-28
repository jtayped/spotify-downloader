"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "../ui/button";
import {
  Search,
  ClipboardPaste,
  Trash2,
  Check,
  X,
  ArrowRight,
  Music2,
  ListMusic,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SpotifyType = "track" | "playlist";

function parseSpotifyUrl(url: string): { type: SpotifyType; id: string } | null {
  try {
    if (!url) return null;
    const parsed = new URL(url);
    if (parsed.hostname !== "open.spotify.com") return null;
    const segments = parsed.pathname.split("/").filter(Boolean);
    const type = segments[0];
    const id = segments[1];
    if ((type === "track" || type === "playlist") && id) {
      return { type: type as SpotifyType, id };
    }
    return null;
  } catch {
    return null;
  }
}

const UrlInput = () => {
  const [inputValue, setInputValue] = useState("");
  const router = useRouter();

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputValue(text);
    } catch {
      // clipboard not available or denied
    }
  };

  const handleSubmit = () => {
    const data = parseSpotifyUrl(inputValue);
    if (data) {
      router.push(`/${data.type}/${data.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const status = !inputValue
    ? ("empty" as const)
    : parseSpotifyUrl(inputValue)
      ? ("valid" as const)
      : ("invalid" as const);

  const parsed = status === "valid" ? parseSpotifyUrl(inputValue) : null;

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full items-center gap-2">
        <InputGroup className="w-full">
          <InputGroupAddon align="inline-start">
            <Search
              className={cn(
                "transition-colors duration-150",
                status === "valid" && "text-primary",
                status === "invalid" && "text-destructive"
              )}
            />
          </InputGroupAddon>

          <InputGroupInput
            className="min-w-0 flex-1"
            placeholder="Paste Spotify link..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Spotify URL"
            aria-invalid={status === "invalid" ? true : undefined}
          />

          <InputGroupAddon align="inline-end" className="flex items-center gap-1">
            {inputValue.length === 0 ? (
              <InputGroupButton
                onClick={handlePaste}
                size="icon-sm"
                aria-label="Paste from clipboard"
                title="Paste from clipboard"
              >
                <ClipboardPaste />
              </InputGroupButton>
            ) : (
              <InputGroupButton
                onClick={() => setInputValue("")}
                size="icon-sm"
                aria-label="Clear"
                title="Clear"
              >
                <Trash2 />
              </InputGroupButton>
            )}

            {status === "valid" && (
              <Check className="size-3.5 shrink-0 text-primary" />
            )}
            {status === "invalid" && (
              <X className="size-3.5 shrink-0 text-destructive" />
            )}
          </InputGroupAddon>
        </InputGroup>

        <Button
          onClick={handleSubmit}
          disabled={status !== "valid"}
          className="shrink-0"
        >
          Open
          <ArrowRight />
        </Button>
      </div>

      {parsed && (
        <div className="animate-in fade-in slide-in-from-top-1 flex items-center gap-1.5 text-xs text-muted-foreground duration-150">
          {parsed.type === "playlist" ? (
            <ListMusic className="size-3 shrink-0 text-primary" />
          ) : (
            <Music2 className="size-3 shrink-0 text-primary" />
          )}
          <span className="capitalize">{parsed.type} detected</span>
          <span className="opacity-30">·</span>
          <span className="opacity-60">
            Press <kbd className="font-mono text-[10px]">↵</kbd> to open
          </span>
        </div>
      )}
    </div>
  );
};

export default UrlInput;
