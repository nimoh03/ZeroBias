import { SkeletonBlock } from "@/components/Skeleton";

export default function JobEditLoading() {
  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
      <SkeletonBlock className="h-8 w-56" />
      <div className="space-y-4">
        <SkeletonBlock className="h-11 w-full rounded-lg" />
        <SkeletonBlock className="h-11 w-full rounded-lg" />
        <SkeletonBlock className="h-32 w-full rounded-lg" />
        <SkeletonBlock className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}