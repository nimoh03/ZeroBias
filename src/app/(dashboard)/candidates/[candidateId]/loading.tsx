import { SkeletonBlock } from "@/components/Skeleton";

export default function CandidateDetailLoading() {
  return (
    <div className="p-6 md:p-8 max-w-container-max mx-auto space-y-6">
      <SkeletonBlock className="h-5 w-72" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm text-center space-y-3">
            <SkeletonBlock className="w-20 h-20 rounded-full mx-auto" />
            <SkeletonBlock className="h-5 w-32 mx-auto" />
            <SkeletonBlock className="h-3 w-40 mx-auto" />
          </div>
          <div className="bg-primary/5 p-6 rounded-xl border border-primary/20 space-y-3">
            <SkeletonBlock className="h-4 w-40" />
            <SkeletonBlock className="h-10 w-24" />
            <SkeletonBlock className="h-3 w-full" />
            <SkeletonBlock className="h-3 w-5/6" />
          </div>
          <div className="space-y-3">
            <SkeletonBlock className="h-11 w-full rounded-xl" />
            <SkeletonBlock className="h-11 w-full rounded-xl" />
            <SkeletonBlock className="h-11 w-full rounded-xl" />
          </div>
        </div>
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm h-[800px] p-6 space-y-4">
          <SkeletonBlock className="h-5 w-48" />
          <SkeletonBlock className="h-16 w-2/3" />
          <SkeletonBlock className="h-16 w-2/3 ml-auto" />
          <SkeletonBlock className="h-16 w-1/2" />
        </div>
      </div>
    </div>
  );
}