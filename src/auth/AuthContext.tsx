import type { ReactNode } from 'react';
import { AuthProvider as SharedAuthProvider, useAuth as useSharedAuth } from '@aireon/shared';

// OIDC auth (provider, hook, userManager) and the login UI now come from
// @aireon/shared. This file is a thin wrapper that re-exposes the shared
// auth state under showroom's original public shape, so existing useAuth()
// callers keep working without changes.

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SharedAuthProvider
      appName="showroom"
      silentSso={false}
      loginPromptOnFirstVisit={false}
      loginDescription="Sign in to see your parcel exports - screenshots, reports and rendered outputs."
    >
      {children}
    </SharedAuthProvider>
  );
}

/**
 * Shared auth state under showroom's original public shape. `avatarUrl` is an
 * alias of the shared `picture` field and `userId` of the OIDC subject claim,
 * so existing callers keep working.
 */
export function useAuth() {
  const auth = useSharedAuth();
  return {
    ...auth,
    avatarUrl: auth.picture ?? '',
    userId: auth.user?.profile.sub ?? '',
  };
}
