import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("bg-raised relative overflow-hidden rounded-md", className)}
    >
      <div className="via-line/70 animate-sweep absolute inset-0 bg-gradient-to-r from-transparent to-transparent" />
    </div>
  );
}

export { Skeleton };
