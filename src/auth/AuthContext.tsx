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
    const init = async () => {
      try {
        if (hasOidcCallbackParams()) {
          const callbackUser = await userManager.signinRedirectCallback();
          setUser(callbackUser);
          window.history.replaceState({}, '', window.location.pathname);
          setIsLoading(false);
          return;
        }

        const storedUser = await userManager.getUser();
        if (storedUser && !storedUser.expired) {
          setUser(storedUser);
          setIsLoading(false);
          return;
        }

        // Try silent SSO so users that already have a Zitadel session land
        // straight in the gallery instead of seeing the sign-in gate flash.
        try {
          const ssoUser = await userManager.signinSilent();
          if (ssoUser && !ssoUser.expired) {
            setUser(ssoUser);
          }
        } catch {
          // No active SSO session — expected when user is genuinely logged out
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      }
      setIsLoading(false);
    };

    init();

    const onUserLoaded = (loadedUser: User) => setUser(loadedUser);
    const onUserUnloaded = () => setUser(null);
    const onTokenExpired = () => setUser(null);

    userManager.events.addUserLoaded(onUserLoaded);
    userManager.events.addUserUnloaded(onUserUnloaded);
    userManager.events.addAccessTokenExpired(onTokenExpired);

    return () => {
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
