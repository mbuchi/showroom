import type { ReactNode } from 'react';
import { AppAccessGate } from '@aireon/shared';
import { TurnstileGate } from '@aireon/shared/turnstile';
import { AppShellSkeleton } from './AppShellSkeleton';

export function ShowroomAccessGate({ children }: { children: ReactNode }) {
  return (
    <TurnstileGate
      appId="showroom"
      siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
      fallback={<AppShellSkeleton />}
    >
      <AppAccessGate
        appId="showroom"
        defaultAccess="public"
        loadingFallback={<AppShellSkeleton />}
      >
        {children}
      </AppAccessGate>
    </TurnstileGate>
  );
}
