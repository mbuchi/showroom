import { userManager } from '@swissnovo/shared';

// Calls the RES reporter backend (project_RES routes/reporter.js), which
// screenshots the 8 map-first apps at the given coordinates.
//
// The backend is non-blocking: a capture runs as a background job, so GET
// /reporter returns { status: 'pending' } until the job finishes. We poll the
// same URL until it returns the report (or an error). The polling loop also
// tolerates a legacy synchronous response (a bare report with no `status`),
// so the frontend can deploy ahead of the backend without breaking.

const REPORTER_BASE = 'https://res.zeroo.ch/reporter';
const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 6 * 60 * 1000; // give up after 6 minutes

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

// Raw shape of a GET /reporter response — `status` is absent on a legacy
// synchronous backend.
interface ReporterResponse {
  status?: 'pending' | 'done' | 'error';
  error?: string;
  lat?: number;
  lng?: number;
  address?: string | null;
  generatedAt?: string;
  captures?: Capture[];
}

async function getAuthToken(): Promise<string> {
  const user = await userManager.getUser();
  if (!user || user.expired) throw new Error('Not authenticated');
  const token = user.id_token || user.access_token;
  if (!token) throw new Error('Not authenticated');
  return token;
}

// Promise that resolves after `ms`, or rejects immediately if `signal` aborts.
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort);
  });
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
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let firstPoll = true;

  while (true) {
    if (opts.signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const params = new URLSearchParams({
      lat: String(opts.lat),
      lng: String(opts.lng),
    });
    if (opts.address) params.set('address', opts.address);
    // refresh only on the first poll — otherwise every poll restarts the job.
    if (opts.refresh && firstPoll) params.set('refresh', '1');
    firstPoll = false;

    const res = await fetch(`${REPORTER_BASE}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: opts.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Report request failed: ${res.status}`);
    }

    const data = (await res.json()) as ReporterResponse;

    if (data.status === 'error') {
      throw new Error(data.error || 'Report generation failed');
    }
    // 'done' (async backend) or a legacy synchronous response carrying the
    // report directly — either way, captures are present.
    if (Array.isArray(data.captures)) {
      return {
        lat: data.lat ?? opts.lat,
        lng: data.lng ?? opts.lng,
        address: data.address ?? opts.address ?? null,
        generatedAt: data.generatedAt ?? new Date().toISOString(),
        captures: data.captures,
      };
    }

    // Still pending — wait, then poll again.
    if (Date.now() > deadline) {
      throw new Error('Report timed out — the capture is taking longer than expected.');
    }
    await delay(POLL_INTERVAL_MS, opts.signal);
  }
}
