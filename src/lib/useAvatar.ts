import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { avatarUrlById } from './avatars';
import { fetchRemoteAvatarId, loadLocalAvatarId, saveAvatarId } from './avatarStorage';

// Shared across every useAvatar() call so a change in one component
// (e.g. AvatarPicker) re-renders all other consumers (e.g. UserMenu)
// without requiring a page refresh.
let currentAvatarId: string | null = null;
let initialized = false;
const subscribers = new Set<(id: string | null) => void>();

function getCurrent(): string | null {
  if (!initialized) {
    currentAvatarId = loadLocalAvatarId();
    initialized = true;
  }
  return currentAvatarId;
}

function broadcast(id: string | null) {
  currentAvatarId = id;
  subscribers.forEach((cb) => cb(id));
}

export function useAvatar() {
  const { user, isAuthenticated } = useAuth();
  const [avatarId, setAvatarIdLocal] = useState<string | null>(() => getCurrent());

  useEffect(() => {
    subscribers.add(setAvatarIdLocal);
    return () => {
      subscribers.delete(setAvatarIdLocal);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void fetchRemoteAvatarId(user?.access_token).then((remote) => {
      if (cancelled || !remote) return;
      broadcast(remote);
      try {
        window.localStorage.setItem('swissnovo:avatar_id', remote);
      } catch {
        /* ignore */
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.profile?.sub, user?.access_token]);

  const setAvatarId = useCallback(
    (id: string) => {
      broadcast(id);
      void saveAvatarId(id, user?.access_token);
    },
    [user?.access_token]
  );

  return { avatarId, setAvatarId, avatarUrl: avatarUrlById(avatarId) };
}
