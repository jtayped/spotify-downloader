import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-14">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
        <Skeleton className="size-44 rounded-xl sm:size-52" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-4 w-52" />
          <Skeleton className="mt-5 h-11 w-64" />
        </div>
      </div>

      <div className="mt-12 space-y-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>

      <span className="sr-only">loading</span>
    </div>
  );
}
