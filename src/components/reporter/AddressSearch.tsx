import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, Search } from 'lucide-react';
import { geocodeAddress, type GeocodeResult } from '../../lib/geocode';

interface AddressSearchProps {
  onSelect: (result: GeocodeResult) => void;
  initialValue?: string;
  autoFocus?: boolean;
}

export default function AddressSearch({ onSelect, initialValue = '', autoFocus }: AddressSearchProps) {
  const [value, setValue] = useState(initialValue);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const timer = window.setTimeout(async () => {
      try {
        const found = await geocodeAddress(trimmed, controller.signal);
        setResults(found);
        setOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Geocoding failed');
        setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    const onClickAway = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, []);

  const choose = (result: GeocodeResult) => {
    setValue(result.label);
    setOpen(false);
    onSelect(result);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = activeIndex >= 0 ? results[activeIndex] : results[0];
      if (pick) choose(pick);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="search"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search a Swiss address…"
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-ink-800/70 border border-white/10 hover:border-white/20 focus:border-cyan-500/50 focus:bg-ink-800 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors"
        />
        {loading && (
          <Loader2 size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cyan-400 animate-spin" />
        )}
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-2 w-full surface-raised rounded-xl overflow-hidden py-1 animate-fade-in-down">
          {results.map((result, i) => (
            <li key={result.id}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => choose(result)}
                className={`w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors ${
                  i === activeIndex ? 'bg-cyan-500/10' : 'hover:bg-white/5'
                }`}
              >
                <MapPin size={14} className="mt-0.5 flex-shrink-0 text-cyan-400" />
                <span className="text-sm text-gray-200 leading-snug">{result.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
