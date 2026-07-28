import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ImageOff, X } from 'lucide-react';
import { Skeleton } from '@aireon/shared';
import { useI18n } from '../../contexts/I18nContext';
import { listImages, type SavedImage } from '../../services/imageService';
import { sanitizeIdxFilename } from '../../lib/idx/latin1';
import { IDX_MAX_PICTURES } from '../../lib/idx/record';
import type { ListingImageRef } from '../../lib/idx/types';

/** Append `-2`, `-3`, … before the extension until the name is free. Two
 *  gallery exports very often share `screenshot.png`, and the IDX images/
 *  folder is flat, so collisions would silently drop pictures. */
function uniqueFilename(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  const dot = base.lastIndexOf('.');
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : '';
  for (let i = 2; i < 100; i += 1) {
    const candidate = `${stem}-${i}${ext}`;
    if (!taken.has(candidate)) return candidate;
  }
  return base;
}

interface ImagePickerProps {
  images: ListingImageRef[];
  onChange: (refs: ListingImageRef[]) => void;
}

/**
 * Picks up to 13 gallery exports for the listing (the IDX 3.01 picture cap),
 * in the order they should appear on the portal. Selection is keyed on the
 * public URL, which is unique per export and is also what the image prep step
 * fetches, so the picker and the engine always agree on what a row refers to.
 */
export default function ImagePicker({ images, onChange }: ImagePickerProps) {
  const { t } = useI18n();
  const [gallery, setGallery] = useState<SavedImage[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setGallery(null);
    setFailed(false);
    listImages()
      .then((list) => {
        if (!cancelled) setGallery(list);
      })
      .catch(() => {
        if (cancelled) return;
        setGallery([]);
        setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const atCap = images.length >= IDX_MAX_PICTURES;

  const toggle = useCallback(
    (image: SavedImage) => {
      const existing = images.findIndex((ref) => ref.publicUrl === image.public_url);
      if (existing >= 0) {
        onChange(images.filter((_, i) => i !== existing));
        return;
      }
      if (images.length >= IDX_MAX_PICTURES) return;
      const base = sanitizeIdxFilename(image.original_filename || `image-${image.id}`);
      const filename = uniqueFilename(base, new Set(images.map((ref) => ref.filename)));
      onChange([
        ...images,
        {
          savedImageId: image.id,
          publicUrl: image.public_url,
          filename,
          title: '',
        },
      ]);
    },
    [images, onChange],
  );

  const move = useCallback(
    (index: number, delta: number) => {
      const target = index + delta;
      if (target < 0 || target >= images.length) return;
      const next = [...images];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      onChange(next);
    },
    [images, onChange],
  );

  const retitle = useCallback(
    (index: number, title: string) => {
      onChange(images.map((ref, i) => (i === index ? { ...ref, title } : ref)));
    },
    [images, onChange],
  );

  return (
    <section className="surface rounded-2xl p-4 sm:p-5">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {t('page.publish.images.title')}
        </h2>
        <span className="text-[11px] tabular-nums text-gray-500">
          {t('page.publish.images.count', { n: images.length })}
        </span>
      </div>
      <p className="mb-3 text-xs leading-snug text-gray-500">{t('page.publish.images.hint')}</p>

      {gallery === null && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="w-full aspect-video" radius={8} delay={`${i * 60}ms`} />
          ))}
        </div>
      )}

      {gallery !== null && gallery.length === 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-gray-400">
          <ImageOff size={16} className="mt-0.5 flex-shrink-0 text-gray-500" />
          <div className="min-w-0">
            <p>{failed ? t('page.reporter.widget.failed_to_load') : t('page.publish.images.empty')}</p>
            {failed && (
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="mt-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200 focus-ring rounded"
              >
                {t('page.reporter.widget.retry')}
              </button>
            )}
          </div>
        </div>
      )}

      {gallery !== null && gallery.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
          {gallery.map((image) => {
            const order = images.findIndex((ref) => ref.publicUrl === image.public_url);
            const selected = order >= 0;
            const blocked = !selected && atCap;
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => toggle(image)}
                disabled={blocked}
                aria-pressed={selected}
                title={image.original_filename}
                className={`relative overflow-hidden rounded-lg border transition-colors focus-ring ${
                  selected
                    ? 'border-cyan-400/60 ring-2 ring-cyan-400/50'
                    : 'border-white/10 hover:border-white/25'
                } ${blocked ? 'cursor-not-allowed opacity-40' : ''}`}
              >
                <img
                  src={image.public_url}
                  alt={image.original_filename}
                  loading="lazy"
                  className="aspect-video w-full object-cover"
                />
                {selected && (
                  <span className="absolute left-1.5 top-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-md bg-cyan-500/90 px-1.5 text-[10px] font-bold text-ink-950 tabular-nums">
                    {order + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {images.length > 0 && (
        <ul className="mt-4 space-y-2">
          {images.map((ref, i) => (
            <li
              key={ref.publicUrl}
              className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2 py-2"
            >
              <span className="w-5 flex-shrink-0 text-center text-[11px] font-bold text-gray-500 tabular-nums">
                {i + 1}
              </span>
              <img
                src={ref.publicUrl}
                alt=""
                className="h-9 w-14 flex-shrink-0 rounded object-cover"
              />
              <input
                type="text"
                value={ref.title}
                onChange={(e) => retitle(i, e.target.value)}
                placeholder={t('page.publish.images.titlePlaceholder')}
                aria-label={t('page.publish.images.titlePlaceholder')}
                className="h-8 min-w-0 flex-1 rounded-lg border border-white/10 bg-ink-900/70 px-2.5 text-sm max-lg:text-base text-gray-200 placeholder-gray-600 focus-ring"
              />
              <div className="flex flex-shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={t('page.publish.images.moveUp', { name: ref.filename })}
                  className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-30 focus-ring"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === images.length - 1}
                  aria-label={t('page.publish.images.moveDown', { name: ref.filename })}
                  className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-30 focus-ring"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, j) => j !== i))}
                  aria-label={t('page.publish.images.remove', { name: ref.filename })}
                  className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-red-300 focus-ring"
                >
                  <X size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {images.length > 0 && (
        <p className="mt-2 truncate font-mono text-[10px] text-gray-600">
          {images.map((ref) => ref.filename).join('  ·  ')}
        </p>
      )}
    </section>
  );
}
