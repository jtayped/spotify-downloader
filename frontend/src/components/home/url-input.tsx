"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Check,
  SearchIcon,
  Cancel01Icon,
  ClipboardIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "../ui/button";

const UrlInput = () => {
  const [inputValue, setInputValue] = useState("");
  const router = useRouter();

  // Helper function to extract type and ID
  const parseSpotifyUrl = (url: string) => {
    try {
      if (!url) return null;
      const parsedUrl = new URL(url);

      // Check if hostname is valid (open.spotify.com)
      if (parsedUrl.hostname !== "open.spotify.com") return null;

      // Pathname usually looks like /track/ID or /playlist/ID
      // split('/') results in ["", "type", "id", ...]
      const segments = parsedUrl.pathname.split("/").filter(Boolean);
      const type = segments[0];
      const id = segments[1];

      // Strict validation: Only allow 'track' or 'playlist'
      if ((type === "track" || type === "playlist") && id) {
        return { type, id };
      }

      return null;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      return null;
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputValue(text);
    } catch (err) {
      console.error("Failed to read clipboard contents: ", err);
    }
  };

  const clearInput = () => {
    setInputValue("");
  };

  const getStatus = () => {
    if (!inputValue) return "empty";
    // Reuse the parser to determine validity
    return parseSpotifyUrl(inputValue) ? "valid" : "invalid";
  };

  const handleSubmit = () => {
    const data = parseSpotifyUrl(inputValue);
    if (data) {
      // Redirect to /{type}/{id}
      router.push(`/${data.type}/${data.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && status === "valid") {
      handleSubmit();
    }
  };

  const status = getStatus();

  return (
    <div className="flex w-full items-center gap-2">
      <InputGroup className="w-full transition-all duration-200 ease-in-out">
        <InputGroupInput
          className="min-w-0 flex-1 bg-transparent"
          placeholder="Paste Spotify link (Track or Playlist)..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Start Addon: Search Icon */}
        <InputGroupAddon align="inline-start">
          <HugeiconsIcon icon={SearchIcon} className="text-gray-400" />
        </InputGroupAddon>

        {/* End Addon: Action Buttons & Validation */}
        <InputGroupAddon align="inline-end" className="flex items-center gap-1">
          {inputValue.length === 0 ? (
            <InputGroupButton
              onClick={handlePaste}
              size="icon-sm"
              aria-label="Paste from clipboard"
              title="Paste from clipboard"
            >
              <HugeiconsIcon icon={ClipboardIcon} size={18} />
            </InputGroupButton>
          ) : (
            <InputGroupButton
              onClick={clearInput}
              size="sm"
              aria-label="Clear input"
              title="Clear input"
            >
              <HugeiconsIcon icon={Delete02Icon} />
            </InputGroupButton>
          )}

          {status === "valid" && (
            <HugeiconsIcon icon={Check} className="text-green-500" />
          )}
          {status === "invalid" && (
            <HugeiconsIcon icon={Cancel01Icon} className="text-red-500" />
          )}
        </InputGroupAddon>
      </InputGroup>

      <Button onClick={handleSubmit} disabled={status !== "valid"}>
        Submit
      </Button>
    </div>
  );
};

export default UrlInput;
