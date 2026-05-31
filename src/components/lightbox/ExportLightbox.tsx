import { useEffect, useRef, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Trash2,
  ExternalLink,
  Download,
  Loader2,
  Info,
} from 'lucide-react';
import type { SavedImage } from '../../services/imageService';
import MetadataPanel from './MetadataPanel';
import { useI18n } from '../../contexts/I18nContext';

interface LightboxProps {
  images: SavedImage[];
  index: number;
  favorites: Set<string>;
  deletingIds: Set<string>;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  onToggleFavorite: (image: SavedImage) => void;
  onDelete: (image: SavedImage) => void;
}

export default function ExportLightbox({
  images,
  index,
  favorites,
  deletingIds,
  onClose,
  onIndexChange,
  onToggleFavorite,
  onDelete,
}: LightboxProps) {
  const [showInfo, setShowInfo] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  const safeIndex = Math.max(0, Math.min(index, images.length - 1));
  const image = images[safeIndex];

  useEffect(() => {
    setImgLoaded(false);
  }, [safeIndex]);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Capture the element that had focus (the gallery card that opened the
    // lightbox) so we can restore focus to it when the lightbox closes —
    // otherwise keyboard users are dropped back at the top of the document.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Move focus into the dialog on open so keyboard/screen-reader users land
    // inside the modal rather than leaving focus on the (now obscured) trigger.
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = original;
      previouslyFocused?.focus();
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'j') {
        e.preventDefault();
        if (safeIndex < images.length - 1) onIndexChange(safeIndex + 1);
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (safeIndex > 0) onIndexChange(safeIndex - 1);
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (image) onToggleFavorite(image);
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setShowInfo((v) => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [images.length, safeIndex, onClose, onIndexChange, onToggleFavorite, image]);

  if (!image) return null;

  const isFavorite = favorites.has(image.id);
  const isDeleting = deletingIds.has(image.id);
  const hasPrev = safeIndex > 0;
  const hasNext = safeIndex < images.length - 1;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-[150] flex flex-col focus:outline-none"
      role="dialog"
      aria-modal="true"
      aria-label={image.original_filename}
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-fade-in" onClick={onClose} />

      <div className="relative flex items-center justify-between px-4 sm:px-6 h-14 border-b border-white/5 bg-black/40 backdrop-blur-md text-gray-200">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs tabular-nums text-gray-400">
            {safeIndex + 1} / {images.length}
          </span>
          <span className="hidden sm:block w-px h-4 bg-white/10" />
          <p className="hidden sm:block text-sm font-medium text-gray-100 truncate">
            {image.original_filename}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <IconButton
            onClick={() => onToggleFavorite(image)}
            label={isFavorite ? t('card.unfavorite_tooltip') : t('card.favorite_tooltip')}
            active={isFavorite}
          >
            <Star size={15} className={isFavorite ? 'fill-current' : ''} />
          </IconButton>
          <a
            href={image.public_url}
            download={image.original_filename}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-300 hover:text-gray-100 hover:bg-white/10 transition-colors focus-ring"
            title={t('modal.detail.download')}
            aria-label={t('modal.detail.download')}
          >
            <Download size={15} />
          </a>
          <a
            href={image.public_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-300 hover:text-gray-100 hover:bg-white/10 transition-colors focus-ring"
            title={t('card.open_original_aria')}
            aria-label={t('card.open_original')}
          >
            <ExternalLink size={15} />
          </a>
          <IconButton
            onClick={() => onDelete(image)}
            label={t('card.delete')}
            disabled={isDeleting}
            danger
          >
            {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          </IconButton>
          <span className="hidden md:block w-px h-5 bg-white/10 mx-0.5" />
          <IconButton
            onClick={() => setShowInfo((v) => !v)}
            label={showInfo ? t('modal.detail.hide_info') : t('modal.detail.show_info')}
            active={showInfo}
          >
            <Info size={15} />
          </IconButton>
          <IconButton onClick={onClose} label={t('modal.detail.close')}>
            <X size={15} />
          </IconButton>
        </div>
      </div>

      <div className="relative flex-1 flex overflow-hidden">
        <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8" onClick={onClose}>
          {hasPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); onIndexChange(safeIndex - 1); }}
              className="absolute left-2 sm:left-4 z-10 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur text-gray-200 hover:text-white flex items-center justify-center transition-colors focus-ring"
              aria-label={t('modal.detail.previous')}
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {hasNext && (
            <button
              onClick={(e) => { e.stopPropagation(); onIndexChange(safeIndex + 1); }}
              className="absolute right-2 sm:right-4 z-10 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur text-gray-200 hover:text-white flex items-center justify-center transition-colors focus-ring"
              aria-label={t('modal.detail.next')}
            >
              <ChevronRight size={20} />
            </button>
          )}

          <div
            className="relative max-w-full max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {!imgLoaded && (
              <Loader2 size={28} className="absolute text-gray-400 animate-spin" />
            )}
            <img
              key={image.id}
              src={image.public_url}
              alt={image.original_filename}
              onLoad={() => setImgLoaded(true)}
              className={`max-w-full max-h-[calc(100dvh-9rem)] object-contain rounded-lg shadow-2xl img-fade-in ${imgLoaded ? 'loaded' : ''}`}
            />
          </div>
        </div>

        {showInfo && (
          <aside
            className="hidden md:flex flex-col w-80 lg:w-96 flex-shrink-0 border-l border-white/5 bg-ink-900/80 backdrop-blur-md overflow-y-auto thin-scrollbar animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <MetadataPanel image={image} />
          </aside>
        )}
      </div>
    </div>
  );
}

function IconButton({
  onClick,
  label,
  children,
  active,
  danger,
  disabled,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors focus-ring disabled:opacity-50 ${
        active
          ? 'text-amber-300 bg-amber-400/15'
          : danger
            ? 'text-gray-300 hover:text-red-300 hover:bg-red-500/20'
            : 'text-gray-300 hover:text-gray-100 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}
