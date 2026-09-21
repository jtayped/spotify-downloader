"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Axios and the runtime throw capitalised sentences ("Request failed with
 * status code 500") that would be the only uppercase copy in the app, and they
 * name a mechanism the user cannot act on. Map what we recognise to product
 * copy and keep the raw message in the console.
 */
function describe(error: Error): string {
  const raw = error.message ?? "";

  if (/status code 5\d\d/i.test(raw)) {
    return "spotify or the download server returned an error. try again in a moment.";
  }
  if (/status code 429/i.test(raw)) {
    return "too many requests to spotify right now. wait a minute and try again.";
  }
  if (/status code 40[13]/i.test(raw)) {
    return "this one is private, or the server is not authorised to read it.";
  }
  if (/network error|ECONNREFUSED|fetch failed|ENOTFOUND/i.test(raw)) {
    return "could not reach the download server. it may still be starting up.";
  }
  return "something went wrong reaching the download server. try again.";
}

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="bg-danger-wash text-danger-text border-danger/25 flex size-11 items-center justify-center rounded-full border">
        <AlertCircle className="size-5" aria-hidden />
      </div>
      <h1 className="text-ink text-xl font-semibold">
        that request did not go through
      </h1>
      <p className="text-ink-muted text-[13px] leading-relaxed">
        {describe(error)}
      </p>
      {error.digest && (
        <p className="text-ink-subtle font-mono text-[11px]">
          reference {error.digest}
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <Button variant="primary" onClick={reset}>
          <RotateCw />
          try again
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/">start over</Link>
        </Button>
      </div>
    </div>
  );
}
