import { Skeleton } from '@aireon/shared';

export default function ParcelSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 p-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl p-3.5 surface-raised">
          <div className="space-y-2 mb-3">
            <Skeleton height={16} radius={4} className="w-3/4" delay={`${i * 80}ms`} />
            <Skeleton height={12} radius={4} className="w-1/2" delay={`${i * 80}ms`} />
          </div>
          <div className="flex gap-2 mb-2">
            <Skeleton width={56} height={20} radius={4} delay={`${i * 80}ms`} />
            <Skeleton width={64} height={20} radius={4} delay={`${i * 80}ms`} />
          </div>
          <div className="flex gap-1.5">
            <Skeleton width={48} height={16} radius={4} delay={`${i * 80}ms`} />
            <Skeleton width={40} height={16} radius={4} delay={`${i * 80}ms`} />
          </div>
        </div>
      ))}
    </div>
  );
}
