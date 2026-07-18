import { SkeletonBlock } from "@/components/Skeleton";

export default function JobNewLoading() {
  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
      <SkeletonBlock className="h-8 w-56" />
      <SkeletonBlock className="h-64 w-full rounded-xl" />
    </div>
  );
}