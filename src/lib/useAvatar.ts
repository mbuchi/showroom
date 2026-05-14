import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { avatarUrlById } from './avatars';
import { fetchRemoteAvatarId, loadLocalAvatarId, saveAvatarId } from './avatarStorage';

export function useAvatar() {
  const { user, isAuthenticated } = useAuth();
  const [avatarId, setAvatarIdState] = useState<string | null>(() => loadLocalAvatarId());

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void fetchRemoteAvatarId(user?.access_token).then((remote) => {
      if (cancelled || !remote) return;
      setAvatarIdState(remote);
      try { window.localStorage.setItem('swissnovo:avatar_id', remote); } catch { /* ignore */ }
    });
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.profile?.sub, user?.access_token]);

  const setAvatarId = useCallback((id: string) => {
    setAvatarIdState(id);
    void saveAvatarId(id, user?.access_token);
  }, [user?.access_token]);

  return { avatarId, setAvatarId, avatarUrl: avatarUrlById(avatarId) };
}
