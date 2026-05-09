import { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, CircleUser as UserCircle, Bookmark, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

interface UserMenuProps {
  onOpenParcels?: () => void;
  exportCount?: number;
}

export default function UserMenu({ onOpenParcels, exportCount }: UserMenuProps) {
  const { isAuthenticated, isLoading, login, logout, displayName, email, avatarUrl } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return <div className="w-9 h-9 rounded-full bg-ink-700 animate-pulse flex-shrink-0" />;
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={login}
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-gray-400 bg-ink-800 hover:bg-ink-700 hover:text-gray-200 transition-colors focus-ring"
        aria-label="Sign in"
      >
        <UserCircle size={20} />
      </button>
    );
  }

  const initials = displayName
    ? displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0]?.toUpperCase() || '?';

  return (
    <>
      <div ref={menuRef} className="relative flex-shrink-0">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 rounded-full transition-all hover:ring-2 hover:ring-cyan-500/40 focus-ring"
          aria-label="Open user menu"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-9 h-9 rounded-full object-cover border-2 border-ink-700"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold border-2 border-ink-700">
              {initials}
            </div>
          )}
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 surface-raised rounded-xl shadow-2xl overflow-hidden z-50 animate-in">
            <div className="px-4 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover border border-ink-700" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-100 truncate">{displayName || 'User'}</p>
                  {email && <p className="text-xs text-gray-400 truncate">{email}</p>}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs text-gray-400">Active session</span>
              </div>
            </div>

            {typeof exportCount === 'number' && (
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
                <ImageIcon size={14} className="text-cyan-400" />
                <span className="text-xs text-gray-400">In your gallery</span>
                <span className="ml-auto text-xs font-semibold text-gray-100 tabular-nums">{exportCount}</span>
              </div>
            )}

            <div className="py-1">
              {onOpenParcels && (
                <button
                  onClick={() => { setIsOpen(false); onOpenParcels(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5 transition-colors"
                >
                  <Bookmark size={16} />
                  <span>Saved parcels</span>
                </button>
              )}
              <button
                onClick={() => { setIsOpen(false); setShowProfile(true); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5 transition-colors"
              >
                <UserCircle size={16} />
                <span>View profile</span>
              </button>
              <button
                onClick={() => { setIsOpen(false); logout(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={16} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showProfile && (
        <ProfileModal
          displayName={displayName}
          email={email}
          avatarUrl={avatarUrl}
          initials={initials}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
}

function ProfileModal({
  displayName, email, avatarUrl, initials, onClose,
}: {
  displayName: string; email: string; avatarUrl: string; initials: string; onClose: () => void;
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative surface-raised rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-scale-in">
        <div className="h-24 bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-500" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col items-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-24 h-24 rounded-full object-cover border-4 border-ink-850 shadow-lg" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-ink-850 shadow-lg">
                {initials}
              </div>
            )}
            <h2 className="mt-4 text-lg font-semibold text-gray-100">{displayName || 'User'}</h2>
            {email && <p className="mt-1 text-sm text-gray-400">{email}</p>}
            <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-emerald-300">Active session</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="mt-6 w-full py-2.5 text-sm font-medium text-gray-200 bg-ink-700 hover:bg-ink-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
