import type { ReactNode } from 'react';
import { ExternalLink, AlertTriangle, MapPinned, RefreshCw } from 'lucide-react';

// Presentational shell for one reporter widget: a 16:10 live-map slot. The
// headline stat renders large over a gradient scrim at the bottom of the map;
// a status badge floats top-right. The footer carries the app label, blurb
// and a deep-link into the live app.

export type WidgetStatus = 'loading' | 'ok' | 'no_data' | 'error';

const STATUS_META: Record<WidgetStatus, { label: string; classes: string }> = {
  ok:      { label: 'Live',    classes: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
  loading: { label: 'Loading', classes: 'text-gray-400 bg-white/5 border-white/10' },
  no_data: { label: 'No data', classes: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
  error:   { label: 'Failed',  classes: 'text-red-300 bg-red-500/10 border-red-500/30' },
};

interface WidgetCardProps {
  label: string;
  blurb: string;
  deepLink: string;
  status: WidgetStatus;
  /** Uppercase caption shown above the headline value, e.g. "Market value". */
  metricLabel?: string;
  /** Headline value, e.g. "CHF 8'450 /m²". */
  stat?: ReactNode;
  /** Optional accent colour for the stat text (e.g. a noise-band hex). */
  statColor?: string;
  error?: string;
  onRetry?: () => void;
  /** The map — MapboxMini / LeafletMini. */
  children: ReactNode;
}

export default function WidgetCard({
  label,
  blurb,
  deepLink,
  status,
  metricLabel,
  stat,
  statColor,
  error,
  onRetry,
  children,
}: WidgetCardProps) {
  const meta = STATUS_META[status];

  return (
    <div className="surface-raised surface-hover rounded-xl overflow-hidden flex flex-col">
      <div className="relative aspect-[16/10] bg-ink-900 overflow-hidden">
        {children}

        {/* Status badge — top-right, every status. */}
        <span
          className={`absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${meta.classes}`}
        >
          {meta.label}
        </span>

        {status === 'loading' && (
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        )}

        {status === 'no_data' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink-900/70 text-amber-300/90">
            <MapPinned size={22} className="text-amber-500/70" />
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              No data at this location
            </span>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink-900/80 text-red-300/90 px-4 text-center">
            <AlertTriangle size={22} className="text-red-500/70" />
            <span className="text-[11px] font-semibold">{error || 'Failed to load'}</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-1 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-semibold border border-white/10 text-gray-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-colors"
              >
                <RefreshCw size={12} />
                Retry
              </button>
            )}
          </div>
        )}

        {/* Headline value — large, over a gradient scrim. Only when live. */}
        {status === 'ok' && stat != null && (
          <div className="absolute inset-x-0 bottom-0 pointer-events-none bg-gradient-to-t from-ink-900/95 via-ink-900/60 to-transparent px-3.5 pt-10 pb-3">
            {metricLabel && (
              <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-300">
                {metricLabel}
              </p>
            )}
            <p
              className="text-2xl sm:text-3xl font-bold tabular-nums leading-none mt-0.5"
              style={{ color: statColor ?? '#22d3ee' }}
            >
              {stat}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-3.5 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-100 truncate">{label}</p>
          <p className="text-[11px] text-gray-500 truncate">{blurb}</p>
        </div>
        <a
          href={deepLink}
          target="_blank"
          rel="noopener noreferrer"
          title={`Open ${label} at this location`}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors flex-shrink-0"
        >
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
