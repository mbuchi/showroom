interface SkeletonProps {
  count?: number;
}

export default function ExportSkeleton({ count = 8 }: SkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden surface-raised"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="aspect-[4/3] animate-shimmer bg-ink-800" />
          <div className="p-3 space-y-2">
            <div className="h-3 w-3/4 rounded bg-ink-700 animate-shimmer" />
            <div className="h-2 w-1/2 rounded bg-ink-700/70 animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GroupedSkeleton({ groups = 3 }: { groups?: number }) {
  return (
    <div className="space-y-8">
      {Array.from({ length: groups }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-4 w-48 rounded bg-ink-700 animate-shimmer" />
            <div className="h-4 w-12 rounded bg-ink-700/70 animate-shimmer" />
          </div>
          <ExportSkeleton count={5} />
        </div>
      ))}
    </div>
  );
}
