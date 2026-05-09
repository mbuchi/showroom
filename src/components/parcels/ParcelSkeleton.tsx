export default function ParcelSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 p-3">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl p-3.5 surface-raised"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="space-y-2 mb-3">
            <div className="h-4 w-3/4 rounded bg-ink-700 animate-shimmer" />
            <div className="h-3 w-1/2 rounded bg-ink-700/70 animate-shimmer" />
          </div>
          <div className="flex gap-2 mb-2">
            <div className="h-5 w-14 rounded bg-ink-700/70 animate-shimmer" />
            <div className="h-5 w-16 rounded bg-ink-700/70 animate-shimmer" />
          </div>
          <div className="flex gap-1.5">
            <div className="h-4 w-12 rounded bg-ink-700/50 animate-shimmer" />
            <div className="h-4 w-10 rounded bg-ink-700/50 animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
