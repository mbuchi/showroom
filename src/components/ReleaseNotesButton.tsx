import { useCallback, useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { CURRENT_VERSION } from '../data/releaseNotes';
import ReleaseNotesPanel from './ReleaseNotesPanel';

const STORAGE_KEY = 'showroom:lastSeenReleaseVersion';
const HASH = '#release-notes';

interface ReleaseNotesButtonProps {
  className?: string;
}

const ReleaseNotesButton = ({ className }: ReleaseNotesButtonProps) => {
  const [open, setOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    try {
      const lastSeen = localStorage.getItem(STORAGE_KEY);
      if (lastSeen !== CURRENT_VERSION) setHasUnread(true);
    } catch {
      /* private mode etc. */
    }

    if (window.location.hash === HASH) setOpen(true);

    const onHash = () => {
      if (window.location.hash === HASH) setOpen(true);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const handleOpen = useCallback(() => {
    setOpen(true);
    if (window.location.hash !== HASH) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}${HASH}`,
      );
    }
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setHasUnread(false);
    try {
      localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    } catch {
      /* ignore */
    }
    if (window.location.hash === HASH) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`,
      );
    }
  }, []);

  return (
    <>
      <button
        onClick={handleOpen}
        title={`What's new — v${CURRENT_VERSION}`}
        aria-label={`What's new — v${CURRENT_VERSION}`}
        className={`hidden sm:inline-flex items-center gap-1.5 h-7 pl-2 pr-2.5 rounded-full text-[11px] font-semibold border transition-colors border-white/10 text-gray-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 ${className ?? ''}`}
      >
        <Sparkles size={12} className="text-cyan-400" />
        <span className="font-mono">v{CURRENT_VERSION}</span>
        {hasUnread && (
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        )}
      </button>
      {open && <ReleaseNotesPanel onClose={handleClose} />}
    </>
  );
};

export default ReleaseNotesButton;
