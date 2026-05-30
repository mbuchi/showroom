import type { ReactNode } from 'react';
import { AuthProvider as SharedAuthProvider, useAuth as useSharedAuth } from '@swissnovo/shared';

// OIDC auth (provider, hook, userManager) and the login UI now come from
// @swissnovo/shared. This file is a thin wrapper that re-exposes the shared
// auth state under showroom's original public shape, so existing useAuth()
// callers keep working without changes.

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SharedAuthProvider
      silentSso={false}
      appName="showroom"
      loginBlocking
      loginDescription="Members only. Showroom is a private gallery for your parcel exports — screenshots, reports and rendered outputs from across the Swissnovo toolbox. Sign in with your Swissnovo account to see yours."
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
