import { cn } from "@/lib/utils";

/** Ring spinner with a real gap, so the rotation is legible at 14px. */
function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="loading"
      className={cn(
        "border-current/25 animate-spin-slow inline-block size-4 rounded-full border-2 border-t-current",
        className,
      )}
    />
  );
}

export { Spinner };
