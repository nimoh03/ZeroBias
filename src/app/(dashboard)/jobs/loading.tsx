import { SkeletonBlock, SkeletonList } from "@/components/Skeleton";

export default function JobsLoading() {
  return (
    <div className="p-6 md:p-10 max-w-[1280px] mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-10 w-36 rounded-xl" />
      </div>
      <SkeletonList count={6} />
    </div>
  );
}