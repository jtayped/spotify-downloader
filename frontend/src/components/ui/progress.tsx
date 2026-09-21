import { cn } from "@/lib/utils";

/**
 * Determinate bar driven by WebSocket progress. Transform-only so the
 * animation stays on the compositor during a long download.
 */
function Progress({
  value,
  className,
  indeterminate = false,
}: {
  value: number;
  className?: string;
  indeterminate?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(clamped)}
      className={cn(
        "bg-raised relative h-1.5 w-full overflow-hidden rounded-full",
        className,
      )}
    >
      {indeterminate ? (
        <div className="bg-accent animate-sweep absolute inset-y-0 w-1/3 rounded-full" />
      ) : (
        <div
          className="bg-accent h-full w-full rounded-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${100 - clamped}%)` }}
        />
      )}
    </div>
  );
}

export { Progress };
