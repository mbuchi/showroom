import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { Search, Command, Images, FileText, Share2, History, Info } from 'lucide-react';
import {
  AboutModal,
  AppNavbar,
  LocaleSelector,
  OpenWithMenu,
  OverflowNav,
  NavIconButton,
  ShareCopiedToast,
  SearchHistoryModal,
  getShareStrings,
  getSearchHistoryStrings,
  useGlassLevel,
} from '@aireon/shared';
import type { OverflowNavItem, MapUserMenuAction } from '@aireon/shared';
import UserMenu from './UserMenu';
import { createShowroomAboutModalProps } from './aboutModalContent';
import { navigate, useRoute } from '../lib/router';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../auth/AuthContext';
import { signal } from '../lib/signal';

const NAV_LINKS: { path: string; labelKey: string; icon: React.ReactNode }[] = [
  { path: '/', labelKey: 'nav.gallery', icon: <Images size={16} aria-hidden="true" /> },
  { path: '/reporter', labelKey: 'nav.reporter', icon: <FileText size={16} aria-hidden="true" /> },
];

interface NavbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  exportCount?: number;
  showSearch?: boolean;
  rightSlot?: React.ReactNode;
  openWithLocation?: { lat: number; lng: number } | null;
}

/**
 * showroom's top bar uses the suite-shared {@link AppNavbar} shell (hub badge +
 * wordmark + account menu), with showroom's own controls slotted in: the
 * Gallery / Reporter nav links + the gallery search box go in the centre, and
 * the mobile ⋯ nav menu + language picker + the app's UserMenu sit in the
 * actions slot. The shell renders inside a sticky wrapper so showroom keeps its
 * scroll-shadow.
 */
const Navbar = forwardRef<HTMLInputElement, NavbarProps>(function Navbar(
  { searchValue = '', onSearchChange, exportCount, showSearch = true, rightSlot, openWithLocation },
  searchRef
) {
  const [scrolled, setScrolled] = useState(false);
  const { locale, setLocale, t } = useI18n();
  const { getAccessToken } = useAuth();
  const glassLevel = useGlassLevel();
  // Search history is now opened from a navbar button (moved out of the account
  // menu). Tracked here so the History icon toggles the shared modal.
  const [showHistory, setShowHistory] = useState(false);
  // "About this app" is also reachable from the account menu, but the suite
  // navbar standard (valoo) surfaces it as a one-tap Info icon too. State lives
  // here so the navbar button can open the shared modal directly.
  const [showAbout, setShowAbout] = useState(false);
  // "Share this view" moved into the account menu; the Navbar still owns its
  // link-copy state so it can flash the suite-standard "Link copied" pill.
  const [shareCopied, setShareCopied] = useState(false);
  const shareTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Copy the current view's link and flash the "Link copied" pill — same
  // behaviour as the old navbar Share button, now driven from the menu row.
  const handleShare = useCallback(() => {
    void navigator.clipboard?.writeText(window.location.href).then(() => {
      setShareCopied(true);
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
      shareTimerRef.current = setTimeout(() => setShareCopied(false), 1800);
    }).catch(() => { /* clipboard blocked — no-op */ });
    void signal.send('Share view', {});
  }, []);

  const shareStrings = getShareStrings(locale);
  const shareAction: MapUserMenuAction = {
    key: 'share',
    label: shareStrings.share,
    icon: <Share2 size={16} aria-hidden="true" />,
    onClick: handleShare,
    signedOut: true,
  };

  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);
  const { pathname } = useRoute();

  // Mobile overflow menu: the primary nav links (Gallery / Reporter) are hidden
  // below `sm` in the desktop <nav>, which left the Reporter page UNREACHABLE on
  // phones. Surface them in a single ⋯ "More tools" menu so every page stays
  // navigable.
  const mobileNavItems: OverflowNavItem[] = NAV_LINKS.map((link) => ({
    key: link.path,
    label: t(link.labelKey),
    icon: link.icon,
    active: link.path === '/' ? pathname === '/' : pathname.startsWith(link.path),
    onSelect: () => navigate(link.path),
  }));

  const navLinks = (
    <nav className="hidden sm:flex items-center gap-1 flex-shrink-0">
      {NAV_LINKS.map((link) => {
        const active = link.path === '/' ? pathname === '/' : pathname.startsWith(link.path);
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
  );

  const searchBox = showSearch ? (
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
  ) : null;

  return (
    <>
    <div
      className={`sticky top-0 z-[45] transition-shadow ${
        scrolled ? 'shadow-[0_8px_24px_rgba(0,0,0,0.35)]' : ''
      }`}
    >
      <AppNavbar
        appName="showroom"
        dark
        position=""
        centerSlot={
          <div className="flex items-center gap-3 w-full min-w-0">
            {navLinks}
            {searchBox}
          </div>
        }
        actionsExtra={
          <>
            {/* "Open with" — cross-app deep-link menu; only shown on the reporter
                route when a location (lat/lng) is active in the URL. */}
            {openWithLocation && (
              <OpenWithMenu
                location={openWithLocation}
                currentAppId="showroom"
                dark
                label={t('nav.open_with')}
                onOpen={(appId) =>
                  void signal.send('Open address in app', {
                    lat: openWithLocation.lat,
                    lng: openWithLocation.lng,
                    metaData: { app: appId },
                  })
                }
              />
            )}
            {/* Mobile-only: surface the nav links (hidden in the sm: <nav> above)
                behind a single ⋯ menu so Reporter/Gallery stay reachable on phones. */}
            <div className="flex sm:hidden items-center">
              <OverflowNav
                items={mobileNavItems}
                dark
                collapseBelow={9999}
                menuLabel={t('menu.more_tools')}
                moreLabel={t('menu.more_tools')}
              />
            </div>
            {/* Search history is now a one-tap navbar button (moved out of the
                account menu) — the highest-frequency secondary control. */}
            <NavIconButton
              icon={<History size={18} aria-hidden="true" />}
              label={getSearchHistoryStrings(locale).menuRow}
              onClick={() => setShowHistory(true)}
              dark
            />
            {/* About (info) — suite navbar standard (valoo): one-tap app details,
                in addition to the account-menu "About this app" row. */}
            <NavIconButton
              icon={<Info size={18} aria-hidden="true" />}
              label={t('about.menu')}
              onClick={() => setShowAbout(true)}
              dark
            />
            <LocaleSelector locale={locale} onChange={setLocale} ariaLabel={t('nav.select_language')} />
            {rightSlot}
          </>
        }
        userMenu={<UserMenu exportCount={exportCount} shareAction={shareAction} />}
      />
    </div>
    {showHistory && (
      <SearchHistoryModal
        locale={locale}
        dark
        authToken={getAccessToken() ?? null}
        onClose={() => setShowHistory(false)}
      />
    )}
    {showAbout && (
      <AboutModal
        {...createShowroomAboutModalProps(t)}
        glassLevel={glassLevel}
        dark
        onClose={() => setShowAbout(false)}
      />
    )}
    <ShareCopiedToast show={shareCopied} label={shareStrings.copied} dark />
    </>
  );
});

export default Navbar;
