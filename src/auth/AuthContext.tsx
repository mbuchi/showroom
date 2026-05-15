import type { ReactNode } from 'react';
import { AuthProvider as SharedAuthProvider, useAuth as useSharedAuth } from '@swissnovo/shared';

// OIDC auth (provider, hook, userManager) now comes from @swissnovo/shared.
// This file is a thin wrapper that re-exposes the shared auth state under
// showroom's original public shape, so existing useAuth() callers — and the
// SignInGate's config-banner — keep working without changes.

// The shared OIDC client carries the suite's Zitadel config baked in, so
// there are no per-deploy auth env vars to validate any more. These two
// exports keep SignInGate's config-banner code path inert.
export const missingAuthEnvVars: string[] = [];
export const isAuthConfigured = true;

export function AuthProvider({ children }: { children: ReactNode }) {
  return <SharedAuthProvider>{children}</SharedAuthProvider>;
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
