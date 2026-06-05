import type { ReactNode } from 'react';
import { ExternalLink, AlertTriangle, MapPinned, RefreshCw, Check } from 'lucide-react';
import { Skeleton } from '@aireon/shared';
import { useI18n } from '../../contexts/I18nContext';

// Presentational shell for one reporter widget: a 16:10 live-map slot. The
// headline stat renders large over a gradient scrim at the bottom of the map;
// a status badge floats top-right; an opt-in selection checkbox floats top-left
// (used by the report builder to choose which widgets enter the PDF). The
// footer carries the app label, blurb and a deep-link into the live app.

export type WidgetStatus = 'loading' | 'ok' | 'no_data' | 'error';

// The badge sits over arbitrary basemap imagery (light, dark, colourful), so
// it carries an opaque dark backing rather than a translucent tint — only the
// status dot and label text carry the per-status colour.
const STATUS_META: Record<WidgetStatus, { labelKey: string; text: string; dot: string }> = {
  ok:      { labelKey: 'page.reporter.widget.status.live',    text: 'text-emerald-300', dot: 'bg-emerald-400' },
  loading: { labelKey: 'page.reporter.widget.status.loading', text: 'text-gray-300',    dot: 'bg-gray-400' },
  no_data: { labelKey: 'page.reporter.widget.status.no_data', text: 'text-amber-300',   dot: 'bg-amber-400' },
  error:   { labelKey: 'page.reporter.widget.status.failed',  text: 'text-red-300',     dot: 'bg-red-400' },
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
  /** True when the widget participates in the report selection UI. */
  selectable?: boolean;
  /** Selection state — only meaningful when `selectable` is true. */
  selected?: boolean;
  /** Called when the user toggles the selection checkbox. */
  onToggleSelect?: () => void;
  /** Stable id used by the PDF capture layer to find this card's map area. */
  captureId?: string;
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
  selectable = false,
  selected = false,
  onToggleSelect,
  captureId,
}: WidgetCardProps) {
  const { t } = useI18n();
  const meta = STATUS_META[status];
  const canSelect = selectable && status === 'ok';

  return (
    <div className="surface-raised surface-hover rounded-xl overflow-hidden flex flex-col">
      <div
        className="reporter-capture relative aspect-[16/10] bg-ink-900 overflow-hidden"
        data-capture-id={captureId}
      >
        {children}

        {/* Selection checkbox — top-left. Only rendered when selectable. Hidden
            from PDF snapshots via data-capture-skip so it never bleeds into
            the captured map image. */}
        {selectable && (
          <button
            type="button"
            onClick={onToggleSelect}
            disabled={!canSelect}
            data-capture-skip="true"
            aria-pressed={selected}
            aria-label={
              selected
                ? t('page.reporter.widget.deselect_for_report', { label })
                : t('page.reporter.widget.select_for_report', { label })
            }
            className={`absolute top-2 left-2 z-20 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold backdrop-blur-sm transition-colors ${
              canSelect
                ? selected
                  ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30'
                  : 'border-white/10 bg-ink-900/85 text-gray-300 hover:border-cyan-400/40 hover:text-cyan-200'
                : 'cursor-not-allowed border-white/5 bg-ink-900/60 text-gray-600'
            }`}
          >
            <span
              className={`flex h-3 w-3 items-center justify-center rounded-sm border ${
                selected
                  ? 'border-cyan-300 bg-cyan-400 text-ink-900'
                  : canSelect
                    ? 'border-white/30 bg-transparent'
                    : 'border-white/10 bg-transparent'
              }`}
            >
              {selected && <Check size={9} strokeWidth={3} />}
            </span>
            <span>
              {selected
                ? t('page.reporter.widget.in_report')
                : t('page.reporter.widget.add_to_report')}
            </span>
          </button>
        )}

        {/* Status badge — top-right, every status. */}
        <span
          data-capture-skip="true"
          className="absolute top-2 right-2 z-20 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-ink-900/85 px-2 py-1 text-[10px] font-semibold text-gray-200 backdrop-blur-sm"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          <span className={meta.text}>{t(meta.labelKey)}</span>
        </span>

        {status === 'loading' && (
          <Skeleton className="absolute inset-0 pointer-events-none" radius={0} />
        )}

        {status === 'no_data' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink-900/70 text-amber-300/90">
            <MapPinned size={22} className="text-amber-500/70" />
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              {t('page.reporter.widget.no_data_at_location')}
            </span>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink-900/80 text-red-300/90 px-4 text-center">
            <AlertTriangle size={22} className="text-red-500/70" />
            <span className="text-[11px] font-semibold">{error || t('page.reporter.widget.failed_to_load')}</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                data-capture-skip="true"
                className="mt-1 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-semibold border border-white/10 text-gray-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-colors"
              >
                <RefreshCw size={12} />
                {t('page.reporter.widget.retry')}
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
          title={t('page.reporter.widget.open_at_location', { label })}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors flex-shrink-0"
        >
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
