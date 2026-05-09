import { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, Bookmark, Search, ExternalLink, Loader2 } from 'lucide-react';
import type { Parcel, ParcelState, ParcelPriority } from '../../types/parcel';
import { fetchParcels } from '../../services/parcelService';
import ParcelCard from './ParcelCard';
import ParcelSkeleton from './ParcelSkeleton';

const ROOFS_URL = 'https://swissnovo-toolbox.vercel.app/';

type FilterState = ParcelState | 'All';
type FilterPriority = ParcelPriority | 'All';

interface SavedParcelsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SavedParcelsPanel({ isOpen, onClose }: SavedParcelsPanelProps) {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<FilterState>('All');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('All');
  const [isClosing, setIsClosing] = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      const data = await fetchParcels();
      setParcels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load parcels');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setIsClosing(false);
    load();
  }, [isOpen, load]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 240);
  };

  const filtered = parcels.filter((p) => {
    if (filterState !== 'All' && p.state !== filterState) return false;
    if (filterPriority !== 'All' && p.priority !== filterPriority) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matches =
        p.address?.toLowerCase().includes(q) ||
        p.municipality?.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      if (!matches) return false;
    }
    return true;
  });

  if (!isOpen) return null;

  const stateOptions: FilterState[] = ['All', 'New', 'Due Diligence', 'Contacted', 'Closed'];
  const priorityOptions: FilterPriority[] = ['All', 'Low', 'Medium', 'High', 'Urgent'];

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
        onClick={handleClose}
      />
      <aside
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[380px] z-50 surface flex flex-col ${
          isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Bookmark size={15} className="text-cyan-400" />
            <h2 className="text-sm font-semibold text-gray-100">Saved parcels</h2>
            {!isLoading && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 tabular-nums">
                {filtered.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => load(true)}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50 focus-ring"
              aria-label="Refresh"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-gray-200 transition-colors focus-ring"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 space-y-2 border-b border-white/5">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search parcels…"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-ink-800/70 border border-white/5 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500/30 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value as FilterState)}
              className="flex-1 px-2 py-1.5 rounded-lg text-xs bg-ink-800/70 border border-white/5 text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
            >
              {stateOptions.map((s) => (
                <option key={s} value={s} className="bg-ink-800">
                  {s === 'All' ? 'All states' : s}
                </option>
              ))}
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
              className="flex-1 px-2 py-1.5 rounded-lg text-xs bg-ink-800/70 border border-white/5 text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
            >
              {priorityOptions.map((p) => (
                <option key={p} value={p} className="bg-ink-800">
                  {p === 'All' ? 'All priorities' : p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto thin-scrollbar">
          {isLoading ? (
            <ParcelSkeleton />
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-red-400 mb-3 break-words">{error}</p>
              <button
                onClick={() => load()}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Try again
              </button>
            </div>
          ) : parcels.length === 0 ? (
            <div className="p-8 text-center">
              <Bookmark size={28} className="mx-auto text-gray-600 mb-3" />
              <p className="text-sm text-gray-300 mb-1">No saved parcels yet</p>
              <p className="text-xs text-gray-500">
                Save parcels in Roofs to track them across the toolbox.
              </p>
              <a
                href={ROOFS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors"
              >
                Open Roofs
                <ExternalLink size={12} />
              </a>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-300 mb-1">No matches</p>
              <p className="text-xs text-gray-500">Try a different search or clear filters.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 p-3">
              {filtered.map((parcel, i) => (
                <ParcelCard key={parcel.id} parcel={parcel} index={i} />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-white/5 p-3">
          <a
            href={ROOFS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-ink-800 hover:bg-ink-700 text-gray-200 transition-colors focus-ring"
          >
            {isRefreshing && parcels.length > 0 ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <ExternalLink size={12} />
            )}
            Manage parcels in Roofs
          </a>
        </div>
      </aside>
    </>
  );
}
