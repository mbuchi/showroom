import { forwardRef, useEffect, useState } from 'react';
import { Images, Search, Command } from 'lucide-react';
import UserMenu from './UserMenu';

interface NavbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onOpenParcels?: () => void;
  exportCount?: number;
  showSearch?: boolean;
  rightSlot?: React.ReactNode;
}

const Navbar = forwardRef<HTMLInputElement, NavbarProps>(function Navbar(
  { searchValue = '', onSearchChange, onOpenParcels, exportCount, showSearch = true, rightSlot },
  searchRef
) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);

  return (
    <header
      className={`sticky top-0 z-40 glass-nav transition-shadow ${
        scrolled ? 'shadow-[0_8px_24px_rgba(0,0,0,0.35)]' : ''
      }`}
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 h-14 flex items-center gap-3">
        <a
          href="/"
          className="flex items-center gap-2 flex-shrink-0 group"
          aria-label="Showroom home"
        >
          <span className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-500 flex items-center justify-center shadow-glow-cyan">
            <Images size={15} className="text-white" />
          </span>
          <span className="hidden sm:flex items-baseline gap-1.5 leading-none">
            <span className="text-2xl font-normal font-varela leading-none">
              <span className="text-gray-900 dark:text-white">showr</span>
              <span className="text-red-600">oo</span>
              <span className="text-gray-900 dark:text-white">m</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500 font-semibold">
              Gallery
            </span>
          </span>
        </a>

        {showSearch && (
          <div className="flex-1 flex items-center justify-center min-w-0">
            <div className="relative w-full max-w-[520px]">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                ref={searchRef}
                type="search"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Search exports, addresses, parcel IDs…"
                className="w-full pl-9 pr-16 py-2 rounded-lg bg-ink-800/70 hover:bg-ink-800 border border-white/5 hover:border-white/10 focus:border-cyan-500/40 focus:bg-ink-800 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors"
              />
              <kbd className="hidden md:flex items-center gap-1 absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-500 bg-ink-700/70 border border-white/5">
                {isMac ? <Command size={10} /> : 'Ctrl'}
                <span>K</span>
              </kbd>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          {rightSlot}
          <UserMenu onOpenParcels={onOpenParcels} exportCount={exportCount} />
        </div>
      </div>
    </header>
  );
});

export default Navbar;
