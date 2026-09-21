import { CollectionSkeleton } from "@/components/collection/collection-skeleton";

export default function Loading() {
  return <CollectionSkeleton measure="max-w-[1400px]" rows={8} />;
}
