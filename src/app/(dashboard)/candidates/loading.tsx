import { SkeletonBlock, SkeletonList } from "@/components/Skeleton";

export default function CandidatesLoading() {
  return (
    <div className="p-6 md:p-10 max-w-[1280px] mx-auto space-y-6">
      <SkeletonBlock className="h-8 w-48" />
      <div className="flex gap-3">
        <SkeletonBlock className="h-10 w-64 rounded-xl" />
        <SkeletonBlock className="h-10 w-40 rounded-xl" />
        <SkeletonBlock className="h-10 w-40 rounded-xl" />
      </div>
      <SkeletonList count={8} />
    </div>
  );
}