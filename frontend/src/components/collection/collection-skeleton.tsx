import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Route skeleton for a release page. `measure` must match the real page's
 * container, or the layout jumps sideways when the content resolves.
 */
function CollectionSkeleton({
  measure,
  rows = 6,
}: {
  measure: string;
  rows?: number;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full space-y-10 px-4 py-8 sm:px-6 sm:py-12",
        measure,
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
        <Skeleton className="size-40 rounded-xl sm:size-48 lg:size-56" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-11 w-2/3" />
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-4 w-60" />
          <Skeleton className="mt-5 h-11 w-52" />
        </div>
      </div>

      <div className="border-line overflow-hidden rounded-xl border">
        <Skeleton className="h-9 w-full rounded-none" />
        <div className="space-y-px p-3">
          {Array.from({ length: rows }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </div>

      <span className="sr-only">loading</span>
    </div>
  );
}

export { CollectionSkeleton };
