import { useCallback, useEffect, useState } from 'react';
import type { WidgetStatus } from '../WidgetCard';

// Shared lifecycle for a reporter widget: a status, a retry handle (which
// bumps `reloadKey` to remount the map), and a safety timeout that flips a
// stuck 'loading' card to 'error' so one hung map never spins forever.

const LOAD_TIMEOUT_MS = 25_000;

export interface ReporterWidgetState {
  reloadKey: number;
  status: WidgetStatus;
  setStatus: (s: WidgetStatus) => void;
  retry: () => void;
}

export function useReporterWidget(): ReporterWidgetState {
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<WidgetStatus>('loading');

  // A retry resets the card to 'loading'.
  useEffect(() => {
    setStatus('loading');
  }, [reloadKey]);

  // Safety net: a card stuck loading past the timeout is treated as failed.
  useEffect(() => {
    if (status !== 'loading') return;
    const t = setTimeout(() => setStatus('error'), LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [status, reloadKey]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  return { reloadKey, status, setStatus, retry };
}
