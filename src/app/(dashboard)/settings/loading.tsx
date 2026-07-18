import { SkeletonBlock } from "@/components/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-6">
      <SkeletonBlock className="h-8 w-40" />
      <SkeletonBlock className="h-40 w-full rounded-xl" />
      <SkeletonBlock className="h-40 w-full rounded-xl" />
    </div>
  );
}