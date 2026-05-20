import type { ParcelState, ParcelPriority } from '../../types/parcel';
import { useI18n } from '../../contexts/I18nContext';

const stateClasses: Record<ParcelState, string> = {
  New: 'bg-sky-500/15 text-sky-300 border-sky-400/20',
  'Due Diligence': 'bg-amber-500/15 text-amber-300 border-amber-400/20',
  Closed: 'bg-slate-500/15 text-slate-300 border-slate-400/20',
  Contacted: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20',
};

const priorityClasses: Record<ParcelPriority, string> = {
  Low: 'bg-slate-500/15 text-slate-300 border-slate-400/20',
  Medium: 'bg-blue-500/15 text-blue-300 border-blue-400/20',
  High: 'bg-orange-500/15 text-orange-300 border-orange-400/20',
  Urgent: 'bg-red-500/15 text-red-300 border-red-500/30',
};

const stateKeys: Record<ParcelState, string> = {
  New: 'parcels.state_new',
  'Due Diligence': 'parcels.state_due_diligence',
  Contacted: 'parcels.state_contacted',
  Closed: 'parcels.state_closed',
};

const priorityKeys: Record<ParcelPriority, string> = {
  Low: 'parcels.priority_low',
  Medium: 'parcels.priority_medium',
  High: 'parcels.priority_high',
  Urgent: 'parcels.priority_urgent',
};

export function StateBadge({ state }: { state: ParcelState }) {
  const { t } = useI18n();
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide border ${stateClasses[state]}`}>
      {t(stateKeys[state])}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: ParcelPriority }) {
  const { t } = useI18n();
  const isUrgent = priority === 'Urgent';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide border ${priorityClasses[priority]}`}>
      {isUrgent && (
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      )}
      {t(priorityKeys[priority])}
    </span>
  );
}

export function TagBadge({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-400/15">
      {tag}
    </span>
  );
}
