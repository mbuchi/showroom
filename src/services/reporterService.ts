import { userManager } from '../auth/authConfig';

// Calls the RES reporter backend (project_RES routes/reporter.js), which
// screenshots the 8 map-first apps at the given coordinates and returns one
// consolidated payload.

const REPORTER_BASE = 'https://res.zeroo.ch/reporter';

export type CaptureStatus = 'ok' | 'cached' | 'no_map' | 'error';

export interface Capture {
  id: string;
  label: string;
  appUrl: string;
  deepLink: string;
  imageUrl: string | null;
  status: CaptureStatus;
  error?: string;
}

export interface ReporterReport {
  lat: number;
  lng: number;
  address: string | null;
  generatedAt: string;
  captures: Capture[];
}

async function getAuthToken(): Promise<string> {
  const user = await userManager.getUser();
  if (!user || user.expired) throw new Error('Not authenticated');
  const token = user.id_token || user.access_token;
  if (!token) throw new Error('Not authenticated');
  return token;
}

export interface GenerateReportOptions {
  lat: number;
  lng: number;
  address?: string | null;
  refresh?: boolean;
  signal?: AbortSignal;
}

export async function generateReport(opts: GenerateReportOptions): Promise<ReporterReport> {
  const token = await getAuthToken();
  const params = new URLSearchParams({
    lat: String(opts.lat),
    lng: String(opts.lng),
  });
  if (opts.address) params.set('address', opts.address);
  if (opts.refresh) params.set('refresh', '1');

  const res = await fetch(`${REPORTER_BASE}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: opts.signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Report request failed: ${res.status}`);
  }
  return res.json();
}
