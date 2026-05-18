import type { ReactNode } from 'react';
import { ExternalLink, AlertTriangle, MapPinned, RefreshCw } from 'lucide-react';

// Presentational shell for one reporter widget: a 16:10 live-map slot. The
// headline stat renders large over a gradient scrim at the bottom of the map;
// a status badge floats top-right. The footer carries the app label, blurb
// and a deep-link into the live app.

export type WidgetStatus = 'loading' | 'ok' | 'no_data' | 'error';

// The badge sits over arbitrary basemap imagery (light, dark, colourful), so
// it carries an opaque dark backing rather than a translucent tint — only the
// status dot and label text carry the per-status colour.
const STATUS_META: Record<WidgetStatus, { label: string; text: string; dot: string }> = {
  ok:      { label: 'Live',    text: 'text-emerald-300', dot: 'bg-emerald-400' },
  loading: { label: 'Loading', text: 'text-gray-300',    dot: 'bg-gray-400' },
  no_data: { label: 'No data', text: 'text-amber-300',   dot: 'bg-amber-400' },
  error:   { label: 'Failed',  text: 'text-red-300',     dot: 'bg-red-400' },
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
        <span className="absolute top-2 right-2 z-20 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-ink-900/85 px-2 py-1 text-[10px] font-semibold text-gray-200 backdrop-blur-sm">
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          <span className={meta.text}>{meta.label}</span>
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
          <div className="reporter-card-stat absolute inset-x-0 bottom-0 z-10 pointer-events-none bg-gradient-to-t from-ink-900/95 via-ink-900/60 to-transparent px-3.5 pt-10 pb-3">
            {metricLabel && (
              <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-300">
                {metricLabel}
              </p>
            )}
            <p className="text-2xl sm:text-3xl font-bold tabular-nums leading-none mt-0.5 text-cyan-400">
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
