import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { type User } from 'oidc-client-ts';
import { userManager } from './authConfig';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  register: () => Promise<void>;
  logout: () => Promise<void>;
  displayName: string;
  email: string;
  avatarUrl: string;
  userId: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

function hasOidcCallbackParams(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.has('code') && params.has('state');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const onUserLoaded = (loadedUser: User) => {
      if (cancelled) return;
      setUser(loadedUser);
    };
    const onUserUnloaded = () => {
      if (cancelled) return;
      setUser(null);
    };
    const onTokenExpired = () => {
      if (cancelled) return;
      setUser(null);
    };

    userManager.events.addUserLoaded(onUserLoaded);
    userManager.events.addUserUnloaded(onUserUnloaded);
    userManager.events.addAccessTokenExpired(onTokenExpired);

    const init = async () => {
      try {
        if (hasOidcCallbackParams()) {
          const callbackUser = await userManager.signinRedirectCallback();
          if (!cancelled) setUser(callbackUser);
          window.history.replaceState({}, '', window.location.pathname);
          return;
        }

        const storedUser = await userManager.getUser();
        if (storedUser && !storedUser.expired) {
          if (!cancelled) setUser(storedUser);
          return;
        }

        // Don't block initial paint on silent SSO. Kick it off in the
        // background — if it succeeds, the `addUserLoaded` listener above
        // will flip us from the sign-in gate to the gallery without the user
        // having to wait through Zitadel's iframe timeout (up to 4s).
        userManager.signinSilent().catch(() => {
          // No active SSO session — expected when user is genuinely logged out
        });
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      userManager.events.removeUserLoaded(onUserLoaded);
      userManager.events.removeUserUnloaded(onUserUnloaded);
      userManager.events.removeAccessTokenExpired(onTokenExpired);
    };
  }, []);

  const login = useCallback(async () => {
    await userManager.signinRedirect();
  }, []);

  const register = useCallback(async () => {
    await userManager.signinRedirect({ extraQueryParams: { prompt: 'create' } });
  }, []);

  const logout = useCallback(async () => {
    await userManager.signoutRedirect();
  }, []);

  const profile = user?.profile;
  const displayName = profile?.name || profile?.preferred_username || '';
  const email = (profile?.email as string) || '';
  const avatarUrl = (profile?.picture as string) || '';
  const userId = (profile?.sub as string) || '';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user && !user.expired,
        login,
        register,
        logout,
        displayName,
        email,
        avatarUrl,
        userId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
