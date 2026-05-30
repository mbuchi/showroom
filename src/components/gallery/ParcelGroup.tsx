import { useState } from 'react';
import { ChevronDown, MapPin, Hash, Layers, Clock } from 'lucide-react';
import type { ParcelGroupData } from '../../lib/grouping';
import type { SavedImage } from '../../services/imageService';
import { APP_LABELS, APP_BADGE_CLASSES } from '../../services/imageService';
import { formatRelativeTime, formatBytes } from '../../lib/format';
import ExportCard from './ExportCard';
import { useI18n } from '../../contexts/I18nContext';

interface ParcelGroupProps {
  group: ParcelGroupData;
  defaultOpen?: boolean;
  favorites: Set<string>;
  deletingIds: Set<string>;
  onOpenExport: (image: SavedImage) => void;
  onToggleFavorite: (image: SavedImage) => void;
  onDelete: (image: SavedImage) => void;
}

const PREVIEW_COUNT = 4;

export default function ParcelGroup({
  group,
  defaultOpen = false,
  favorites,
  deletingIds,
  onOpenExport,
  onToggleFavorite,
  onDelete,
}: ParcelGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { t } = useI18n();

  const title =
    group.address ||
    (group.parcelId
      ? `${t('gallery.group.parcel_prefix')} ${group.parcelId}`
      : t('gallery.group.unassigned'));
  const previewItems = open ? group.exports : group.exports.slice(0, PREVIEW_COUNT);
  const remaining = Math.max(0, group.exports.length - PREVIEW_COUNT);

  return (
    <section className="rounded-2xl surface-raised overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`${open ? 'Collapse' : 'Expand'} ${title}`}
        className="w-full px-4 sm:px-5 py-4 flex items-start gap-3 hover:bg-white/[0.02] transition-colors text-left focus-ring"
      >
        <div className="mt-0.5 w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-300 flex items-center justify-center flex-shrink-0">
          <MapPin size={15} aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h3 className="text-sm font-semibold text-gray-400 truncate" title={title}>
              {title}
            </h3>
            {group.parcelId && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-100">
                <Hash size={10} aria-hidden="true" />
                {group.parcelId}
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Layers size={11} aria-hidden="true" />
              {t(
                group.exports.length === 1
                  ? 'gallery.group.exports_one'
                  : 'gallery.group.exports_other',
                { count: group.exports.length },
              )}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={11} aria-hidden="true" />
              {formatRelativeTime(group.lastActivity)}
            </span>
            <span className="text-gray-600">·</span>
            <span className="tabular-nums">{formatBytes(group.totalBytes)}</span>
          </div>

          {group.apps.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {group.apps.map((app) => (
                <span
                  key={app}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                    APP_BADGE_CLASSES[app] || 'bg-ink-700 text-gray-300 border-white/10'
                  }`}
                >
                  {APP_LABELS[app] || app}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!open && remaining > 0 && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-gray-300 bg-ink-700">
              +{remaining}
            </span>
          )}
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      <div className={`px-4 sm:px-5 pb-5 ${open ? '' : 'pt-1'}`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {previewItems.map((img, i) => (
            <ExportCard
              key={img.id}
              image={img}
              index={i}
              isFavorite={favorites.has(img.id)}
              isDeleting={deletingIds.has(img.id)}
              onOpen={() => onOpenExport(img)}
              onToggleFavorite={() => onToggleFavorite(img)}
              onDelete={() => onDelete(img)}
            />
          ))}
          {!open && remaining > 0 && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t('gallery.group.show_all')}
              className="rounded-xl border border-dashed border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 text-gray-400 hover:text-cyan-300 transition-colors aspect-[4/3] flex flex-col items-center justify-center text-center px-3 focus-ring"
            >
              <span className="text-2xl font-semibold tabular-nums">+{remaining}</span>
              <span className="mt-1 text-[11px]">{t('gallery.group.show_all')}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
