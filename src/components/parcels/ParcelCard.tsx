import { MapPin, Clock } from 'lucide-react';
import type { Parcel } from '../../types/parcel';
import { StateBadge, PriorityBadge, TagBadge } from './ParcelBadges';
import { formatShortDate } from '../../lib/format';

interface ParcelCardProps {
  parcel: Parcel;
  index: number;
}

export default function ParcelCard({ parcel, index }: ParcelCardProps) {
  return (
    <div
      className="rounded-xl p-3.5 surface-raised animate-card-enter"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="flex items-start gap-2 mb-2">
        <MapPin size={13} className="text-cyan-300 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-100 truncate leading-tight">
            {parcel.address || 'No address'}
          </h4>
          {parcel.municipality && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {parcel.municipality}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <StateBadge state={parcel.state} />
        <PriorityBadge priority={parcel.priority} />
      </div>

      {parcel.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {parcel.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 text-[11px] text-gray-500">
        <Clock size={11} />
        <span>{formatShortDate(parcel.created_at)}</span>
      </div>
    </div>
  );
}
