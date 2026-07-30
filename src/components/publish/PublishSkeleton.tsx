import { Skeleton } from '@aireon/shared';

/**
 * Loading skeleton shaped like the publish page: faux navbar, kicker header,
 * then the two-column layout - form section cards + image grid on the left,
 * the sticky validation/export/guide rail on the right. Mirrors PublishView's
 * real classes (max-w-[1600px] shell, lg:grid-cols-[minmax(0,1fr)_400px])
 * so the swap to live content is position-stable.
 *
 * Kept dependency-free of PublishView so App.tsx can import it eagerly
 * without pulling the lazy publish chunk into the boot bundle.
 */

function FieldSkeleton({ delay }: { delay?: string }) {
  return (
    <div className="space-y-1.5">
      <Skeleton width={96} height={12} radius={4} delay={delay} />
      <Skeleton height={36} radius={8} className="w-full" delay={delay} />
    </div>
  );
}

function SectionCardSkeleton({ fields, baseDelay }: { fields: number; baseDelay: number }) {
  return (
    <section className="surface rounded-2xl p-4 sm:p-5">
      <Skeleton width={128} height={12} radius={4} className="mb-3.5" delay={`${baseDelay}ms`} />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: fields }).map((_, i) => (
          <FieldSkeleton key={i} delay={`${baseDelay + (i + 1) * 40}ms`} />
        ))}
      </div>
    </section>
  );
}

function RailCardSkeleton({ rows, baseDelay }: { rows: number; baseDelay: number }) {
  return (
    <section className="surface rounded-2xl p-4 sm:p-5">
      <Skeleton width={112} height={12} radius={4} className="mb-3" delay={`${baseDelay}ms`} />
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} height={i === 0 ? 36 : 14} radius={8} className="w-full" delay={`${baseDelay + (i + 1) * 50}ms`} />
        ))}
      </div>
    </section>
  );
}

export default function PublishSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-[45] glass-nav">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 sm:px-6">
          <Skeleton width={112} height={20} radius={4} />
          <Skeleton circle width={32} />
        </div>
      </div>
      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <Skeleton width={176} height={14} radius={4} />
            <Skeleton height={14} radius={4} className="w-full max-w-2xl" delay="60ms" />
          </div>
          <Skeleton width={112} height={36} radius={8} delay="90ms" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0 space-y-4">
            {/* Prefill / address search card */}
            <section className="surface rounded-2xl p-4 sm:p-5">
              <Skeleton width={144} height={12} radius={4} className="mb-3" delay="120ms" />
              <Skeleton height={36} radius={8} className="w-full" delay="160ms" />
              <Skeleton width={224} height={12} radius={4} className="mt-2.5" delay="200ms" />
            </section>
            <SectionCardSkeleton fields={4} baseDelay={240} />
            <SectionCardSkeleton fields={6} baseDelay={420} />
            {/* Image picker card */}
            <section className="surface rounded-2xl p-4 sm:p-5">
              <Skeleton width={128} height={12} radius={4} className="mb-3.5" delay="640ms" />
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="w-full aspect-video" radius={8} delay={`${680 + i * 50}ms`} />
                ))}
              </div>
            </section>
          </div>
          <div className="space-y-4 self-start lg:sticky lg:top-20">
            <RailCardSkeleton rows={4} baseDelay={300} />
            <RailCardSkeleton rows={3} baseDelay={480} />
            <RailCardSkeleton rows={3} baseDelay={620} />
          </div>
        </div>
      </main>
    </div>
  );
}
