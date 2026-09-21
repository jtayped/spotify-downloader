import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "bg-surface border-line text-ink placeholder:text-ink-subtle h-9 w-full rounded-md border px-3 text-[13px] outline-none",
        "transition-[border-color,background-color] duration-150 ease-out",
        "hover:border-line-strong focus:border-accent focus:bg-canvas",
        "aria-[invalid=true]:border-danger/60",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
