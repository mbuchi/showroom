import { Skeleton } from '@swissnovo/shared';

interface SkeletonProps {
  count?: number;
}

export default function ExportSkeleton({ count = 8 }: SkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden surface-raised">
          <Skeleton className="w-full aspect-[4/3]" radius={0} delay={`${i * 60}ms`} />
          <div className="p-3 space-y-2">
            <Skeleton height={12} radius={4} className="w-3/4" delay={`${i * 60}ms`} />
            <Skeleton height={8} radius={4} className="w-1/2" delay={`${i * 60}ms`} />
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
            <Skeleton width={192} height={16} radius={4} />
            <Skeleton width={48} height={16} radius={4} />
          </div>
          <ExportSkeleton count={5} />
        </div>
      ))}
    </div>
  );
}
