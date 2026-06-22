import type { ReactNode } from 'react';
import { AppAccessGate, useAppAccess } from '@aireon/shared';
import { AppShellSkeleton } from './AppShellSkeleton';

export function ShowroomAccessGate({ children }: { children: ReactNode }) {
  const { decision } = useAppAccess('showroom', 'public');
  return (
    <>
      <AppAccessGate appId="showroom" defaultAccess="public">
        {children}
      </AppAccessGate>
      {decision === 'loading' && <AppShellSkeleton overlay />}
    </>
  );
}
