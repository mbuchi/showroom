import { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, CircleUser as UserCircle, Bookmark, Image as ImageIcon, Sparkles } from 'lucide-react';
import {
  Skeleton,
  Avatar,
  ProfileModal,
  SavedParcelsModal,
  ReleaseNotesPanel,
  useReleaseNotes,
  useUserProfile,
  firstNameOf,
  fullNameOf,
  emailOf,
  initialsOf,
  type PrmRecord,
  type PrmLocale,
} from '@aireon/shared';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { RELEASES, REPO_URL } from '../data/releaseNotes';

interface UserMenuProps {
  onOpenParcels?: () => void;
  exportCount?: number;
}

export default function UserMenu({ onOpenParcels, exportCount }: UserMenuProps) {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const { t, locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSavedParcels, setShowSavedParcels] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { avatarUrl } = useUserProfile(user);
  const rn = useReleaseNotes({
    currentVersion: RELEASES[0].version,
    storageKey: 'showroom:lastSeenReleaseVersion',
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // SavedParcelsModal "Open here" → reload the reporter at the parcel's
  // coordinates so the rest of the page picks up the focus on mount.
  const openParcelHere = (rec: PrmRecord) => {
    setShowSavedParcels(false);
    const params = new URLSearchParams({
      lat: String(rec.parcel_lat),
      lng: String(rec.parcel_lng),
    });
    if (rec.parcel_label) params.set('q', rec.parcel_label);
    window.location.href = `/reporter?${params.toString()}`;
  };

  if (isLoading) {
    return <Skeleton circle width={36} className="flex-shrink-0" />;
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={login}
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-gray-400 bg-ink-800 hover:bg-ink-700 hover:text-gray-200 transition-colors focus-ring"
        aria-label={t('nav.sign_in')}
      >
        <UserCircle size={20} />
      </button>
    );
  }

  const firstName = firstNameOf(user);
  const displayName = fullNameOf(user);
  const email = emailOf(user);
  const initials = initialsOf(user);

  return (
    <>
      <div ref={menuRef} className="relative flex-shrink-0">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full transition-all hover:ring-2 hover:ring-cyan-500/40 focus-ring"
          aria-label={t('nav.open_user_menu')}
        >
          <Avatar url={avatarUrl} initials={initials} size={28} />
          <span className="text-sm font-medium hidden sm:block max-w-[100px] truncate text-gray-200">
            {firstName}
          </span>
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 surface-raised rounded-xl shadow-2xl overflow-hidden z-50 animate-in">
            <div className="px-4 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Avatar url={avatarUrl} initials={initials} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-100 truncate">{displayName || firstName || t('menu.user_fallback')}</p>
                  {email && <p className="text-xs text-gray-400 truncate">{email}</p>}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs text-gray-400">{t('menu.active_session')}</span>
              </div>
            </div>

            {typeof exportCount === 'number' && (
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
                <ImageIcon size={14} className="text-cyan-400" />
                <span className="text-xs text-gray-400">{t('menu.in_your_gallery')}</span>
                <span className="ml-auto text-xs font-semibold text-gray-100 tabular-nums">{exportCount}</span>
              </div>
            )}

            <div className="px-2 py-1.5 border-b border-white/5">
              <p className="px-2 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {t('menu.more_tools')}
              </p>
              <button
                onClick={() => { setIsOpen(false); rn.openPanel(); }}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-gray-200 hover:bg-white/5 transition-colors"
              >
                <Sparkles size={16} />
                <span className="flex-1 text-left">{t('menu.release_notes')}</span>
                {rn.hasUnread && (
                  <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
                )}
              </button>
            </div>

            <div className="py-1">
              {onOpenParcels && (
                <button
                  onClick={() => { setIsOpen(false); onOpenParcels(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5 transition-colors"
                >
                  <Bookmark size={16} />
                  <span>{t('menu.saved_parcels')}</span>
                </button>
              )}
              <button
                onClick={() => { setIsOpen(false); setShowSavedParcels(true); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5 transition-colors"
              >
                <Bookmark size={16} />
                <span>{t('menu.my_saved_parcels')}</span>
              </button>
              <button
                onClick={() => { setIsOpen(false); setShowProfile(true); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5 transition-colors"
              >
                <UserCircle size={16} />
                <span>{t('menu.view_profile')}</span>
              </button>
              <button
                onClick={() => { setIsOpen(false); logout(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={16} />
                <span>{t('menu.sign_out')}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showProfile && user && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} />
      )}
      {showSavedParcels && (
        <SavedParcelsModal
          locale={locale as PrmLocale}
          onClose={() => setShowSavedParcels(false)}
          onOpenHere={openParcelHere}
        />
      )}
      {rn.isOpen && (
        <ReleaseNotesPanel
          onClose={rn.closePanel}
          locale={locale}
          releases={RELEASES}
          repoUrl={REPO_URL}
          brandPrefix="showr"
          brandSuffix="m"
        />
      )}
    </>
  );
}
