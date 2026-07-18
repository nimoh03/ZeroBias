import { SkeletonBlock, SkeletonStatRow } from "@/components/Skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="p-6 md:p-10 max-w-[1280px] mx-auto space-y-8">
      <SkeletonBlock className="h-8 w-48" />
      <SkeletonStatRow count={4} />
      <SkeletonBlock className="h-72 w-full rounded-xl" />
    </div>
  );
}