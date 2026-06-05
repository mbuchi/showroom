import { forwardRef, useEffect, useState } from 'react';
import { Search, Command } from 'lucide-react';
import { LocaleSelector } from '@aireon/shared';
import UserMenu from './UserMenu';
import { navigate, useRoute } from '../lib/router';
import { useI18n } from '../contexts/I18nContext';

const NAV_LINKS: { path: string; labelKey: string }[] = [
  { path: '/', labelKey: 'nav.gallery' },
  { path: '/reporter', labelKey: 'nav.reporter' },
];

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
  const { locale, setLocale, t } = useI18n();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);
  const { pathname } = useRoute();

  return (
    <header
      className={`sticky top-0 z-[45] glass-nav transition-shadow ${
        scrolled ? 'shadow-[0_8px_24px_rgba(0,0,0,0.35)]' : ''
      }`}
    >
      <div className="mx-auto max-w-[1600px] px-5 h-14 flex items-center gap-3">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          className="flex items-center gap-2 flex-shrink-0 group rounded-md focus-ring"
          aria-label="showroom home"
        >
          <span className="text-2xl font-normal font-display leading-none tracking-[-0.01em]">
            <span className="text-gray-900 dark:text-white text-2xl font-normal font-display leading-none">showr</span><span className="text-red-500 dark:text-red-400 text-2xl font-normal font-display leading-none">oo</span><span className="text-gray-900 dark:text-white text-2xl font-normal font-display leading-none">m</span>
          </span>
        </a>

        <nav className="hidden sm:flex items-center gap-1 flex-shrink-0">
          {NAV_LINKS.map((link) => {
            const active =
              link.path === '/' ? pathname === '/' : pathname.startsWith(link.path);
            return (
              <a
                key={link.path}
                href={link.path}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(link.path);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] uppercase tracking-[0.14em] font-semibold transition-colors ${
                  active
                    ? 'text-cyan-300 bg-cyan-500/10'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                {t(link.labelKey)}
              </a>
            );
          })}
        </nav>

        {showSearch && (
          <div className="flex-1 flex items-center justify-center min-w-0">
            <div className="relative w-full max-w-[520px]">
              <Search
                size={14}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                ref={searchRef}
                type="search"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={t('nav.search_placeholder')}
                aria-label={t('nav.search_placeholder')}
                className="w-full pl-9 pr-16 py-2 rounded-lg bg-ink-800/70 hover:bg-ink-800 border border-white/5 hover:border-white/10 focus:border-cyan-500/40 focus:bg-ink-800 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors"
              />
              <kbd className="hidden md:flex items-center gap-1 absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-500 bg-ink-700/70 border border-white/5">
                {isMac ? <Command size={10} /> : 'Ctrl'}
                <span>K</span>
              </kbd>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto">
          <LocaleSelector
            locale={locale}
            onChange={setLocale}
            ariaLabel={t('nav.select_language')}
          />
          {rightSlot}
          <UserMenu onOpenParcels={onOpenParcels} exportCount={exportCount} />
        </div>
      </div>
    </header>
  );
});

export default Navbar;
