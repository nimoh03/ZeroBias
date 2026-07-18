import { SkeletonBlock, SkeletonStatRow, SkeletonList } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-10 max-w-[1280px] mx-auto space-y-8">
      <SkeletonBlock className="h-8 w-64" />
      <SkeletonStatRow count={4} />
      <div className="space-y-4">
        <SkeletonBlock className="h-5 w-40" />
        <SkeletonList count={5} />
      </div>
    </div>
  );
}