// Full-page skeleton for the reporter route. It stands in while auth is still
// resolving and while the lazy reporter chunk (mapbox-gl + leaflet, ~550 KB
// gzipped) downloads — so opening a /reporter link lands on the page's shape
// rather than a bare spinner. Pure layout: no auth, no heavy imports.

function Block({ className = '' }: { className?: string }) {
  return <div className={`bg-ink-700 animate-shimmer ${className}`} />;
}

export default function ReporterSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Faux navbar — the real one mounts with the reporter chunk. */}
      <div className="sticky top-0 z-[45] glass-nav">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 sm:px-6">
          <Block className="h-5 w-28 rounded" />
          <Block className="h-8 w-8 rounded-full" />
        </div>
      </div>

      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 sm:py-8">
        {/* Page header */}
        <div className="mb-6 space-y-2">
          <Block className="h-4 w-28 rounded" />
          <Block className="h-3.5 w-full max-w-2xl rounded" />
        </div>

        {/* Address search */}
        <Block className="mb-8 h-11 max-w-xl rounded-xl" />

        {/* Location bar */}
        <div className="surface mb-6 flex items-center justify-between rounded-xl px-4 py-4 sm:px-5">
          <div className="space-y-1.5">
            <Block className="h-3.5 w-56 rounded sm:w-72" />
            <Block className="h-3 w-32 rounded" />
          </div>
          <Block className="h-8 w-28 rounded-lg" />
        </div>

        {/* Five widget cards — mirrors ReportGrid's layout. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="surface-raised overflow-hidden rounded-xl">
              <div
                className="aspect-[16/10] bg-ink-700 animate-shimmer"
                style={{ animationDelay: `${i * 90}ms` }}
              />
              <div className="flex items-center justify-between gap-2 px-3.5 py-3">
                <div className="space-y-1.5">
                  <Block className="h-3.5 w-20 rounded" />
                  <Block className="h-2.5 w-28 rounded" />
                </div>
                <Block className="h-7 w-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
