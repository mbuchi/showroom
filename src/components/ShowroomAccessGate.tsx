import type { ReactNode } from 'react';
import { AppAccessGate } from '@aireon/shared';
import { AppShellSkeleton } from './AppShellSkeleton';

export function ShowroomAccessGate({ children }: { children: ReactNode }) {
  return (
    <AppAccessGate
      appId="showroom"
      defaultAccess="public"
      loadingFallback={<AppShellSkeleton />}
    >
      {children}
    </AppAccessGate>
  );
}
