import { useState } from 'react';
import { Star, Trash2, ExternalLink, Loader2, Hash } from 'lucide-react';
import type { SavedImage } from '../../services/imageService';
import { APP_LABELS, APP_BADGE_CLASSES } from '../../services/imageService';
import { formatRelativeTime } from '../../lib/format';

interface ExportCardProps {
  image: SavedImage;
  index?: number;
  isFavorite: boolean;
  isDeleting?: boolean;
  onOpen: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

export default function ExportCard({
  image,
  index = 0,
  isFavorite,
  isDeleting,
  onOpen,
  onToggleFavorite,
  onDelete,
}: ExportCardProps) {
  const [loaded, setLoaded] = useState(false);
  const appLabel = APP_LABELS[image.app_source] || image.app_source;
  const appClass = APP_BADGE_CLASSES[image.app_source] || 'bg-ink-700 text-gray-300 border-white/10';
  const address = image.custom_metadata?.address;
  const parcelId = image.prm_id || image.custom_metadata?.central_parcel_id;

  return (
    <div
      className="group relative rounded-xl overflow-hidden surface-raised surface-hover animate-card-enter"
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
    >
      <button
        onClick={onOpen}
        className="block w-full text-left focus-ring"
        aria-label={`Open ${image.original_filename}`}
      >
        <div className="relative aspect-[4/3] bg-ink-900 overflow-hidden">
          {!loaded && <div className="absolute inset-0 animate-shimmer" />}
          <img
            src={image.public_url}
            alt={image.original_filename}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04] img-fade-in ${loaded ? 'loaded' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

          <span className={`absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border backdrop-blur-md ${appClass}`}>
            {appLabel}
          </span>

          {isFavorite && (
            <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-400/90 backdrop-blur flex items-center justify-center shadow">
              <Star size={12} className="text-ink-900 fill-current" />
            </span>
          )}
        </div>
      </button>

      <div className="absolute inset-x-0 bottom-0 px-3 pt-8 pb-3 bg-gradient-to-t from-black/85 via-black/55 to-transparent translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
        <div className="flex items-center gap-1 text-[11px] text-gray-300 truncate">
          {address ? (
            <span className="truncate" title={address}>{address}</span>
          ) : parcelId ? (
            <span className="inline-flex items-center gap-1 font-mono text-gray-300/90">
              <Hash size={10} />
              {parcelId}
            </span>
          ) : (
            <span className="text-gray-400 truncate">{image.original_filename}</span>
          )}
        </div>
      </div>

      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {!isFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="w-7 h-7 rounded-md bg-ink-900/80 hover:bg-ink-800 text-gray-200 backdrop-blur flex items-center justify-center transition-colors focus-ring"
            aria-label="Add to favorites"
            title="Favorite (F)"
          >
            <Star size={13} />
          </button>
        )}
        {isFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="w-7 h-7 rounded-md bg-amber-400/90 hover:bg-amber-300 text-ink-900 backdrop-blur flex items-center justify-center transition-colors focus-ring"
            aria-label="Remove from favorites"
            title="Unfavorite (F)"
          >
            <Star size={13} className="fill-current" />
          </button>
        )}
        <a
          href={image.public_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="w-7 h-7 rounded-md bg-ink-900/80 hover:bg-ink-800 text-gray-200 backdrop-blur flex items-center justify-center transition-colors focus-ring"
          aria-label="Open original in new tab"
          title="Open original"
        >
          <ExternalLink size={13} />
        </a>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          disabled={isDeleting}
          className="w-7 h-7 rounded-md bg-ink-900/80 hover:bg-red-500/30 text-gray-200 hover:text-red-300 backdrop-blur flex items-center justify-center transition-colors focus-ring disabled:opacity-50"
          aria-label="Delete export"
          title="Delete"
        >
          {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </div>

      <div className="px-3 py-2.5 border-t border-white/5">
        <p className="text-xs font-medium text-gray-100 truncate" title={image.original_filename}>
          {image.original_filename}
        </p>
        <p className="mt-0.5 text-[11px] text-gray-500 tabular-nums">
          {image.width}×{image.height} · {formatRelativeTime(image.created_at)}
        </p>
      </div>
    </div>
  );
}
