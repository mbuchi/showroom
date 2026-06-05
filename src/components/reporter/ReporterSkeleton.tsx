// Full-page skeleton for the reporter route. It stands in while auth is still
// resolving and while the lazy reporter chunk (mapbox-gl + leaflet, ~550 KB
// gzipped) downloads — so opening a /reporter link lands on the page's shape
// rather than a bare spinner. Pure layout: no auth, no heavy imports.

import { Skeleton } from '@aireon/shared';

export default function ReporterSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Faux navbar — the real one mounts with the reporter chunk. */}
      <div className="sticky top-0 z-[45] glass-nav">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 sm:px-6">
          <Skeleton width={112} height={20} radius={4} />
          <Skeleton circle width={32} />
        </div>
      </div>

      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 sm:py-8">
        {/* Page header */}
        <div className="mb-6 space-y-2">
          <Skeleton width={112} height={16} radius={4} />
          <Skeleton height={14} radius={4} className="w-full max-w-2xl" />
        </div>

        {/* Address search */}
        <Skeleton height={44} radius={12} className="mb-8 max-w-xl" />

        {/* Location bar */}
        <div className="surface mb-6 flex items-center justify-between rounded-xl px-4 py-4 sm:px-5">
          <div className="space-y-1.5">
            <Skeleton height={14} radius={4} className="w-56 sm:w-72" />
            <Skeleton width={128} height={12} radius={4} />
          </div>
          <Skeleton width={112} height={32} radius={8} />
        </div>

        {/* Five widget cards — mirrors ReportGrid's layout. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="surface-raised overflow-hidden rounded-xl">
              <Skeleton className="w-full aspect-[16/10]" radius={0} delay={`${i * 90}ms`} />
              <div className="flex items-center justify-between gap-2 px-3.5 py-3">
                <div className="space-y-1.5">
                  <Skeleton width={80} height={14} radius={4} />
                  <Skeleton width={112} height={10} radius={4} />
                </div>
                <Skeleton width={28} height={28} radius={8} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
