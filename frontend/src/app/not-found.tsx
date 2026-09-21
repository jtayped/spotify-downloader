import Link from "next/link";
import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="bg-surface border-line text-ink-subtle flex size-11 items-center justify-center rounded-full border">
        <SearchX className="size-5" aria-hidden />
      </div>
      <h1 className="text-ink text-xl font-semibold">nothing here</h1>
      <p className="text-ink-muted text-[13px] leading-relaxed">
        spotify has no track, album or playlist with that id, or it is private
        and this app cannot reach it.
      </p>
      <Button variant="primary" asChild className="mt-2">
        <Link href="/">paste another link</Link>
      </Button>
    </div>
  );
}
