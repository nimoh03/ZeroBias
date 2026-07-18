// Shared building blocks for loading skeletons across the dashboard.
// Keeping these in one place means every route's loading.tsx (and any
// component-level <Suspense fallback>) looks consistent instead of each
// page inventing its own shimmer.

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200/70 rounded-lg ${className}`} />;
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm ${className}`}>
      <SkeletonBlock className="h-4 w-1/3 mb-4" />
      <SkeletonBlock className="h-8 w-1/2" />
    </div>
  );
}

export function SkeletonRow({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border border-outline-variant bg-surface-container-lowest ${className}`}>
      <SkeletonBlock className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-3.5 w-1/3" />
        <SkeletonBlock className="h-3 w-1/4" />
      </div>
      <SkeletonBlock className="h-6 w-20 rounded-full" />
    </div>
  );
}

export function SkeletonStatRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}