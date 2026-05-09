import { Filter, Grid3x3, LayoutGrid, RefreshCw, Star, Loader2, ArrowDownWideNarrow } from 'lucide-react';
import type { SortMode } from '../../lib/grouping';
import { APP_LABELS } from '../../services/imageService';

export type ViewMode = 'grouped' | 'flat';

interface GalleryToolbarProps {
  totalCount: number;
  filteredCount: number;
  viewMode: ViewMode;
  sortMode: SortMode;
  appFilters: string[];
  availableApps: string[];
  favoritesOnly: boolean;
  isRefreshing: boolean;
  onViewModeChange: (mode: ViewMode) => void;
  onSortChange: (mode: SortMode) => void;
  onToggleApp: (app: string) => void;
  onToggleFavorites: () => void;
  onClearFilters: () => void;
  onRefresh: () => void;
}

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'recent', label: 'Recently added' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'count', label: 'Most exports' },
  { value: 'address', label: 'A → Z' },
];

export default function GalleryToolbar(props: GalleryToolbarProps) {
  const {
    totalCount,
    filteredCount,
    viewMode,
    sortMode,
    appFilters,
    availableApps,
    favoritesOnly,
    isRefreshing,
    onViewModeChange,
    onSortChange,
    onToggleApp,
    onToggleFavorites,
    onClearFilters,
    onRefresh,
  } = props;

  const filtered = filteredCount !== totalCount;
  const hasActiveFilter = appFilters.length > 0 || favoritesOnly;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-100 tracking-tight">Your gallery</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            {filtered ? (
              <>
                <span className="text-gray-300 tabular-nums">{filteredCount}</span> of{' '}
                <span className="tabular-nums">{totalCount}</span> exports shown
              </>
            ) : (
              <>
                <span className="text-gray-300 tabular-nums">{totalCount}</span>{' '}
                exports across the Swissnovo toolbox
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFavorites}
            aria-pressed={favoritesOnly}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors focus-ring ${
              favoritesOnly
                ? 'bg-amber-400/15 border-amber-400/30 text-amber-200'
                : 'bg-ink-800/70 border-white/5 text-gray-300 hover:bg-ink-700 hover:border-white/10'
            }`}
          >
            <Star size={13} className={favoritesOnly ? 'fill-current' : ''} />
            <span className="hidden sm:inline">Favorites</span>
          </button>

          <div className="hidden sm:flex items-center bg-ink-800/70 border border-white/5 rounded-lg p-0.5">
            <ToolbarToggle
              active={viewMode === 'grouped'}
              icon={<LayoutGrid size={13} />}
              label="Grouped"
              onClick={() => onViewModeChange('grouped')}
            />
            <ToolbarToggle
              active={viewMode === 'flat'}
              icon={<Grid3x3 size={13} />}
              label="Flat"
              onClick={() => onViewModeChange('flat')}
            />
          </div>

          <div className="relative">
            <ArrowDownWideNarrow
              size={13}
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <select
              value={sortMode}
              onChange={(e) => onSortChange(e.target.value as SortMode)}
              className="pl-7 pr-7 py-1.5 rounded-lg text-xs font-medium bg-ink-800/70 hover:bg-ink-700 border border-white/5 hover:border-white/10 text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-ink-800">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-ink-800/70 hover:bg-ink-700 border border-white/5 hover:border-white/10 text-gray-400 hover:text-gray-200 transition-colors focus-ring disabled:opacity-50"
            aria-label="Refresh"
            title="Refresh"
          >
            {isRefreshing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          </button>
        </div>
      </div>

      {availableApps.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pb-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
            <Filter size={11} />
            From
          </span>
          {availableApps.map((app) => {
            const active = appFilters.includes(app);
            return (
              <button
                key={app}
                onClick={() => onToggleApp(app)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors focus-ring ${
                  active
                    ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-200'
                    : 'bg-ink-800/60 border-white/5 text-gray-400 hover:bg-ink-700 hover:border-white/10 hover:text-gray-200'
                }`}
              >
                {APP_LABELS[app] || app}
              </button>
            );
          })}
          {hasActiveFilter && (
            <button
              onClick={onClearFilters}
              className="ml-1 text-[11px] text-gray-500 hover:text-gray-300 underline-offset-2 hover:underline transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ToolbarToggle({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
        active ? 'bg-ink-700 text-gray-100' : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
