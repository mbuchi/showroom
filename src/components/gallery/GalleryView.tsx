import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { listImages, deleteImage, type SavedImage } from '../../services/imageService';
import { groupExportsByParcel, sortGroups, sortFlat, matchesQuery, type SortMode } from '../../lib/grouping';
import { loadFavorites, saveFavorites } from '../../lib/favorites';
import Navbar from '../Navbar';
import ExportSkeleton, { GroupedSkeleton } from './ExportSkeleton';
import EmptyState, { ErrorState } from './EmptyState';
import GalleryToolbar, { type ViewMode } from './GalleryToolbar';
import ParcelGroup from './ParcelGroup';
import ExportCard from './ExportCard';
import ExportLightbox from '../lightbox/ExportLightbox';
import SavedParcelsPanel from '../parcels/SavedParcelsPanel';
import { ReleaseNotesButton } from '@swissnovo/shared';
import { RELEASES, REPO_URL } from '../../data/releaseNotes';

const FILTERS_STORAGE_KEY = 'showroom:filters:v1';

interface PersistedFilters {
  viewMode: ViewMode;
  sortMode: SortMode;
}

function loadPersistedFilters(): PersistedFilters {
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return { viewMode: 'grouped', sortMode: 'recent' };
    const parsed = JSON.parse(raw);
    return {
      viewMode: parsed.viewMode === 'flat' ? 'flat' : 'grouped',
      sortMode: ['recent', 'oldest', 'count', 'address'].includes(parsed.sortMode)
        ? parsed.sortMode
        : 'recent',
    };
  } catch {
    return { viewMode: 'grouped', sortMode: 'recent' };
  }
}

export default function GalleryView() {
  const { userId } = useAuth();

  const [images, setImages] = useState<SavedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const persisted = useRef(loadPersistedFilters());
  const [searchValue, setSearchValue] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(persisted.current.viewMode);
  const [sortMode, setSortMode] = useState<SortMode>(persisted.current.sortMode);
  const [appFilters, setAppFilters] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites(userId));

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [parcelsPanelOpen, setParcelsPanelOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFavorites(loadFavorites(userId));
  }, [userId]);

  useEffect(() => {
    try {
      localStorage.setItem(
        FILTERS_STORAGE_KEY,
        JSON.stringify({ viewMode, sortMode })
      );
    } catch {
      // ignore quota errors — filters are non-critical
    }
  }, [viewMode, sortMode]);

  const load = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      const data = await listImages();
      setImages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exports');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Focus the search bar from anywhere via "/" or "Cmd+K". Also handle Esc to
  // unfocus or to clear the active query.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        if (searchValue) setSearchValue('');
        else searchInputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [searchValue]);

  const availableApps = useMemo(() => {
    return Array.from(new Set(images.map((i) => i.app_source))).sort();
  }, [images]);

  // Apply text + app + favorites filters in one pass; keep this fast since it
  // runs on every keystroke.
  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      if (favoritesOnly && !favorites.has(img.id)) return false;
      if (appFilters.length > 0 && !appFilters.includes(img.app_source)) return false;
      if (!matchesQuery(img, searchValue.trim())) return false;
      return true;
    });
  }, [images, favoritesOnly, favorites, appFilters, searchValue]);

  const sortedFlat = useMemo(() => sortFlat(filteredImages, sortMode), [filteredImages, sortMode]);
  const sortedGroups = useMemo(
    () => sortGroups(groupExportsByParcel(filteredImages), sortMode),
    [filteredImages, sortMode]
  );

  // The lightbox always navigates over the *currently visible* set so users
  // never get teleported into hidden exports.
  const lightboxImage = lightboxIndex !== null ? sortedFlat[lightboxIndex] : null;

  const updateFavorites = useCallback(
    (mutator: (next: Set<string>) => void) => {
      setFavorites((prev) => {
        const next = new Set(prev);
        mutator(next);
        saveFavorites(userId, next);
        return next;
      });
    },
    [userId]
  );

  const toggleFavorite = useCallback(
    (image: SavedImage) => {
      updateFavorites((next) => {
        if (next.has(image.id)) next.delete(image.id);
        else next.add(image.id);
      });
    },
    [updateFavorites]
  );

  const handleDelete = useCallback(
    async (image: SavedImage) => {
      if (!window.confirm(`Delete "${image.original_filename}"? This cannot be undone.`)) return;
      setDeletingIds((prev) => new Set(prev).add(image.id));
      try {
        await deleteImage(image.id);
        setImages((prev) => prev.filter((i) => i.id !== image.id));
        updateFavorites((next) => next.delete(image.id));
        setLightboxIndex((current) => {
          if (current === null) return null;
          // Recompute index against the post-delete sortedFlat would be ideal,
          // but we approximate by stepping back if we were at the end.
          const remaining = sortedFlat.length - 1;
          if (remaining <= 0) return null;
          return Math.min(current, remaining - 1);
        });
      } catch (err) {
        window.alert(err instanceof Error ? err.message : 'Failed to delete export');
      } finally {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(image.id);
          return next;
        });
      }
    },
    [sortedFlat.length, updateFavorites]
  );

  const openExport = useCallback(
    (image: SavedImage) => {
      const idx = sortedFlat.findIndex((i) => i.id === image.id);
      if (idx >= 0) setLightboxIndex(idx);
    },
    [sortedFlat]
  );

  const toggleApp = useCallback((app: string) => {
    setAppFilters((prev) =>
      prev.includes(app) ? prev.filter((a) => a !== app) : [...prev, app]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setAppFilters([]);
    setFavoritesOnly(false);
    setSearchValue('');
  }, []);

  const isFiltering =
    appFilters.length > 0 || favoritesOnly || searchValue.trim().length > 0;

  return (
    <>
      <Navbar
        ref={searchInputRef}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onOpenParcels={() => setParcelsPanelOpen(true)}
        exportCount={images.length}
        rightSlot={
          <ReleaseNotesButton
            releases={RELEASES}
            repoUrl={REPO_URL}
            storageKey="showroom:lastSeenReleaseVersion"
            brandPrefix="showr"
            brandSuffix="m"
          />
        }
      />

      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 sm:py-8">
        <GalleryToolbar
          totalCount={images.length}
          filteredCount={filteredImages.length}
          viewMode={viewMode}
          sortMode={sortMode}
          appFilters={appFilters}
          availableApps={availableApps}
          favoritesOnly={favoritesOnly}
          isRefreshing={isRefreshing}
          onViewModeChange={setViewMode}
          onSortChange={setSortMode}
          onToggleApp={toggleApp}
          onToggleFavorites={() => setFavoritesOnly((v) => !v)}
          onClearFilters={clearFilters}
          onRefresh={() => load(true)}
        />

        <div className="mt-6">
          {isLoading ? (
            viewMode === 'grouped' ? <GroupedSkeleton /> : <ExportSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={() => load()} />
          ) : images.length === 0 ? (
            <EmptyState variant="no-exports" />
          ) : filteredImages.length === 0 ? (
            <EmptyState
              variant={favoritesOnly && appFilters.length === 0 && !searchValue ? 'no-favorites' : 'no-results'}
              onClear={isFiltering ? clearFilters : undefined}
            />
          ) : viewMode === 'grouped' ? (
            <div className="space-y-5">
              {sortedGroups.map((group, i) => (
                <ParcelGroup
                  key={group.parcelId || `__ungrouped-${i}`}
                  group={group}
                  defaultOpen={sortedGroups.length === 1 || group.exports.length <= 4}
                  favorites={favorites}
                  deletingIds={deletingIds}
                  onOpenExport={openExport}
                  onToggleFavorite={toggleFavorite}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {sortedFlat.map((img, i) => (
                <ExportCard
                  key={img.id}
                  image={img}
                  index={i}
                  isFavorite={favorites.has(img.id)}
                  isDeleting={deletingIds.has(img.id)}
                  onOpen={() => openExport(img)}
                  onToggleFavorite={() => toggleFavorite(img)}
                  onDelete={() => handleDelete(img)}
                />
              ))}
            </div>
          )}
        </div>

        {!isLoading && !error && images.length > 0 && (
          <footer className="mt-12 pt-6 border-t border-white/5 text-center text-[11px] text-gray-600">
            <p>
              Tips: <kbd className="px-1.5 py-0.5 rounded bg-ink-800 border border-white/5">/</kbd> to search ·{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-ink-800 border border-white/5">←</kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-ink-800 border border-white/5">→</kbd> to navigate ·{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-ink-800 border border-white/5">F</kbd> to favorite ·{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-ink-800 border border-white/5">Esc</kbd> to close
            </p>
          </footer>
        )}
      </main>

      {lightboxImage && lightboxIndex !== null && (
        <ExportLightbox
          images={sortedFlat}
          index={lightboxIndex}
          favorites={favorites}
          deletingIds={deletingIds}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
          onToggleFavorite={toggleFavorite}
          onDelete={handleDelete}
        />
      )}

      <SavedParcelsPanel
        isOpen={parcelsPanelOpen}
        onClose={() => setParcelsPanelOpen(false)}
      />
    </>
  );
}
