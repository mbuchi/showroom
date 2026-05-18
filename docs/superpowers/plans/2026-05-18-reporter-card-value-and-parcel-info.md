# Reporter Card Value + Parcel Info Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each reporter card's headline value large and prominent as a map overlay, and add a parcel-info chip strip below the cards sourced from the RES API.

**Architecture:** A new Vercel edge function proxies the RES `parcel_data` endpoint with a server-side token. A client module fetches and normalizes the parcel feature into a typed `ParcelInfo`. `WidgetCard` is restructured so the stat renders large over a gradient scrim on the map. A new `ParcelInfoStrip` component renders the parcel facts after the grid.

**Tech Stack:** React 18 + TypeScript, Vite, Tailwind, Vitest, lucide-react, Vercel edge functions.

---

## File Structure

**New**
- `api/parcel-data.ts` — edge function proxying `POST /res_api/parcel_data`.
- `src/lib/parcelInfo.ts` — `fetchParcelInfo` + pure `normalizeParcelProps`.
- `src/lib/__tests__/parcelInfo.test.ts` — unit tests for the normalizer.
- `src/components/reporter/ParcelInfoStrip.tsx` — self-fetching chip strip.

**Modified**
- `src/components/reporter/WidgetCard.tsx` — value→map overlay, status badge→map overlay, `metricLabel` prop, footer simplified.
- `src/components/reporter/widgets/ValooWidget.tsx`
- `src/components/reporter/widgets/RoofsWidget.tsx`
- `src/components/reporter/widgets/RootsWidget.tsx`
- `src/components/reporter/widgets/SoolarWidget.tsx`
- `src/components/reporter/widgets/BoomWidget.tsx`
- `src/components/reporter/ReporterView.tsx` — render `ParcelInfoStrip`.
- `.env.example` — document `RES_API_TOKEN`.

---

## Task 1: Edge function — `api/parcel-data.ts`

**Files:**
- Create: `api/parcel-data.ts`
- Modify: `.env.example`

- [ ] **Step 1: Create the edge function**

Create `api/parcel-data.ts`:

```ts
// Vercel Edge Function: /api/parcel-data
//
// Proxies parcel lookups to the RES API's `parcel_data` endpoint, injecting
// the RES token server-side so it never reaches the browser. Mirrors the
// signal-collect proxy. The reporter's ParcelInfoStrip calls this.

export const config = {
  runtime: "edge",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const DEFAULT_PARCEL_API_URL = "https://res.zeroo.ch/res_api/parcel_data";

function readEnv(...names: string[]): string | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  if (env) {
    for (const name of names) {
      const value = env[name];
      if (value) return value;
    }
  }
  const denoEnv = (globalThis as { Deno?: { env?: { get(name: string): string | undefined } } }).Deno?.env;
  if (denoEnv) {
    for (const name of names) {
      const value = denoEnv.get(name);
      if (value) return value;
    }
  }
  return undefined;
}

const PARCEL_API_URL = readEnv("PARCEL_API_URL") ?? DEFAULT_PARCEL_API_URL;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const token = readEnv("RES_API_TOKEN");
  if (!token) {
    return json({ error: "RES_API_TOKEN not configured" }, 500);
  }

  let lat: unknown;
  let lng: unknown;
  try {
    const body = await req.json();
    lat = body?.lat;
    lng = body?.lng;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (
    typeof lat !== "number" || !Number.isFinite(lat) ||
    typeof lng !== "number" || !Number.isFinite(lng)
  ) {
    return json({ error: "Body must include numeric lat and lng" }, 400);
  }

  try {
    const upstream = await fetch(PARCEL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify({ lat, lng }),
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return json({ error: (error as Error).message }, 502);
  }
}
```

- [ ] **Step 2: Document the env var**

Append to `.env.example`:

```
# ── RES API parcel lookup (required for the /reporter parcel info strip) ────
# Server-side token for the RES `parcel_data` endpoint. Set in the Vercel
# project (Production + Preview). Without it the parcel strip shows
# "Parcel details unavailable" — the cards still work.
RES_API_TOKEN=your_res_api_token
```

- [ ] **Step 3: Typecheck**

Run: `npm run build`
Expected: PASS (build succeeds; the edge function compiles).

- [ ] **Step 4: Commit**

```bash
git add api/parcel-data.ts .env.example
git commit -m "feat: add parcel-data edge function proxying RES parcel_data"
```

---

## Task 2: Client module — `src/lib/parcelInfo.ts`

**Files:**
- Create: `src/lib/parcelInfo.ts`
- Test: `src/lib/__tests__/parcelInfo.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/parcelInfo.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { normalizeParcelProps } from '../parcelInfo';

describe('normalizeParcelProps', () => {
  it('maps a representative parcel_data properties object', () => {
    const info = normalizeParcelProps(
      {
        address: 'Bahnhofstrasse 1',
        zip: 8001,
        cityname: 'Zürich',
        canton: 'ZH',
        parcel_id: 'CH807151234567',
        bldg_size: 420,
        bldg_vol_sb3dgdb: 1850,
        bldg_flats: 8,
        cz_abbrev: 'W3',
      },
      47.3768,
      8.5395,
    );
    expect(info).toEqual({
      address: 'Bahnhofstrasse 1',
      locality: '8001 Zürich ZH',
      egrid: 'CH807151234567',
      buildingSizeM2: 420,
      buildingVolumeM3: 1850,
      flats: 8,
      zone: 'W3',
      lat: 47.3768,
      lng: 8.5395,
    });
  });

  it('normalizes missing, null, zero and negative fields to null', () => {
    const info = normalizeParcelProps(
      {
        address: '',
        bldg_size: 0,
        bldg_vol_sb3dgdb: -5,
        bldg_flats: null,
        cz_abbrev: '   ',
      },
      47,
      8,
    );
    expect(info.address).toBeNull();
    expect(info.locality).toBeNull();
    expect(info.egrid).toBeNull();
    expect(info.buildingSizeM2).toBeNull();
    expect(info.buildingVolumeM3).toBeNull();
    expect(info.flats).toBeNull();
    expect(info.zone).toBeNull();
    expect(info.lat).toBe(47);
    expect(info.lng).toBe(8);
  });

  it('assembles locality skipping blank components', () => {
    const info = normalizeParcelProps(
      { zip: 3000, cityname: '', canton: 'BE' },
      47,
      8,
    );
    expect(info.locality).toBe('3000 BE');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/parcelInfo.test.ts`
Expected: FAIL — cannot resolve `../parcelInfo` / `normalizeParcelProps` is not defined.

- [ ] **Step 3: Write the implementation**

Create `src/lib/parcelInfo.ts`:

```ts
// Parcel-level context for the reporter — the general facts about the parcel
// at a searched location (address, EGRID, size, flats, zone, coordinates).
//
// The RES `parcel_data` endpoint needs a server-side token, so the request is
// proxied through the /api/parcel-data Vercel edge function.

const PARCEL_ENDPOINT = '/api/parcel-data';

export interface ParcelInfo {
  address: string | null;          // street line, e.g. "Bahnhofstrasse 1"
  locality: string | null;         // "8001 Zürich ZH"
  egrid: string | null;            // parcel_id
  buildingSizeM2: number | null;   // bldg_size
  buildingVolumeM3: number | null; // bldg_vol_sb3dgdb
  flats: number | null;            // bldg_flats
  zone: string | null;             // cz_abbrev
  lat: number;
  lng: number;
}

/** Coerce to a positive finite number, else null. */
function num(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : null;
}

/** Coerce to a non-empty trimmed string (numbers stringified), else null. */
function txt(v: unknown): string | null {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

/**
 * Map a `parcel_data` feature's `properties` object into typed ParcelInfo.
 * Pure — no network — so it can be unit-tested directly.
 */
export function normalizeParcelProps(
  props: Record<string, unknown>,
  lat: number,
  lng: number,
): ParcelInfo {
  const locality = [props.zip, props.cityname, props.canton]
    .map(txt)
    .filter((s): s is string => s !== null)
    .join(' ');
  return {
    address: txt(props.address),
    locality: locality.length > 0 ? locality : null,
    egrid: txt(props.parcel_id),
    buildingSizeM2: num(props.bldg_size),
    buildingVolumeM3: num(props.bldg_vol_sb3dgdb),
    flats: num(props.bldg_flats),
    zone: txt(props.cz_abbrev),
    lat,
    lng,
  };
}

/**
 * Fetch parcel context for a coordinate. Returns null on any failure or when
 * no parcel feature is found — callers treat null as "no parcel data".
 */
export async function fetchParcelInfo(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<ParcelInfo | null> {
  try {
    const res = await fetch(PARCEL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
      signal,
    });
    if (!res.ok) return null;
    const json = await res.json();
    const props = json?.features?.[0]?.properties;
    if (!props || typeof props !== 'object') return null;
    return normalizeParcelProps(props as Record<string, unknown>, lat, lng);
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/parcelInfo.test.ts`
Expected: PASS — 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/parcelInfo.ts src/lib/__tests__/parcelInfo.test.ts
git commit -m "feat: add parcelInfo client module with tested normalizer"
```

---

## Task 3: Component — `src/components/reporter/ParcelInfoStrip.tsx`

**Files:**
- Create: `src/components/reporter/ParcelInfoStrip.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/reporter/ParcelInfoStrip.tsx`:

```tsx
import { useEffect, useState, type ReactNode } from 'react';
import {
  MapPin, Fingerprint, Ruler, Box, Building2, Map as MapIcon, Crosshair,
} from 'lucide-react';
import { fetchParcelInfo, type ParcelInfo } from '../../lib/parcelInfo';

// Parcel-context strip rendered below the reporter cards: a wrapping row of
// chips with the general facts of the parcel at the searched location.
// Self-fetching; degrades quietly to a one-line notice if the RES API is
// unavailable so it never blocks the report above it.

interface ParcelInfoStripProps {
  lat: number;
  lng: number;
}

type State =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ok'; info: ParcelInfo };

function Chip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-white/10 bg-white/5 text-xs text-gray-200">
      <span className="text-cyan-400 flex-shrink-0">{icon}</span>
      <span className="tabular-nums">{children}</span>
    </span>
  );
}

export default function ParcelInfoStrip({ lat, lng }: ParcelInfoStripProps) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    const ctrl = new AbortController();
    setState({ kind: 'loading' });
    fetchParcelInfo(lat, lng, ctrl.signal)
      .then((info) => {
        if (ctrl.signal.aborted) return;
        setState(info ? { kind: 'ok', info } : { kind: 'error' });
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setState({ kind: 'error' });
      });
    return () => ctrl.abort();
  }, [lat, lng]);

  if (state.kind === 'loading') {
    return (
      <div className="surface rounded-xl px-4 py-3 mt-6 text-xs text-gray-500">
        Loading parcel details…
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div className="surface rounded-xl px-4 py-3 mt-6 text-xs text-gray-500">
        Parcel details unavailable for this location.
      </div>
    );
  }

  const { info } = state;
  const fmt = (n: number) => n.toLocaleString('de-CH');

  return (
    <div className="surface rounded-xl px-4 py-3 mt-6 flex flex-wrap items-center gap-2">
      {info.address && (
        <Chip icon={<MapPin size={13} />}>
          {[info.address, info.locality].filter(Boolean).join(', ')}
        </Chip>
      )}
      {!info.address && info.locality && (
        <Chip icon={<MapPin size={13} />}>{info.locality}</Chip>
      )}
      {info.egrid && <Chip icon={<Fingerprint size={13} />}>{info.egrid}</Chip>}
      {info.buildingSizeM2 != null && (
        <Chip icon={<Ruler size={13} />}>{fmt(info.buildingSizeM2)} m²</Chip>
      )}
      {info.buildingVolumeM3 != null && (
        <Chip icon={<Box size={13} />}>{fmt(info.buildingVolumeM3)} m³</Chip>
      )}
      {info.flats != null && (
        <Chip icon={<Building2 size={13} />}>
          {info.flats} {info.flats === 1 ? 'flat' : 'flats'}
        </Chip>
      )}
      {info.zone && <Chip icon={<MapIcon size={13} />}>{info.zone}</Chip>}
      <Chip icon={<Crosshair size={13} />}>
        {info.lat.toFixed(6)}, {info.lng.toFixed(6)}
      </Chip>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS — no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/reporter/ParcelInfoStrip.tsx
git commit -m "feat: add ParcelInfoStrip chip-strip component"
```

---

## Task 4: Wire `ParcelInfoStrip` into `ReporterView.tsx`

**Files:**
- Modify: `src/components/reporter/ReporterView.tsx`

- [ ] **Step 1: Add the import**

In `src/components/reporter/ReporterView.tsx`, after the line
`import ReportGrid from './ReportGrid';` add:

```ts
import ParcelInfoStrip from './ParcelInfoStrip';
```

- [ ] **Step 2: Render the strip after the grid**

Find this block (inside `{params && ( … )}`):

```tsx
            <ReportGrid
              key={`${params.lat},${params.lng},${regenKey}`}
              lat={params.lat}
              lng={params.lng}
            />
```

Replace it with:

```tsx
            <ReportGrid
              key={`${params.lat},${params.lng},${regenKey}`}
              lat={params.lat}
              lng={params.lng}
            />

            <ParcelInfoStrip lat={params.lat} lng={params.lng} />
```

(`ParcelInfoStrip` is intentionally not keyed with `regenKey` — the parcel
facts do not change between widget regenerations; its own effect re-fetches
when lat/lng change.)

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/reporter/ReporterView.tsx
git commit -m "feat: render ParcelInfoStrip below the reporter grid"
```

---

## Task 5: Restructure `WidgetCard.tsx` — value + status as map overlays

**Files:**
- Modify: `src/components/reporter/WidgetCard.tsx` (full rewrite)

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `src/components/reporter/WidgetCard.tsx` with:

```tsx
import type { ReactNode } from 'react';
import { ExternalLink, AlertTriangle, MapPinned, RefreshCw } from 'lucide-react';

// Presentational shell for one reporter widget: a 16:10 live-map slot. The
// headline stat renders large over a gradient scrim at the bottom of the map;
// a status badge floats top-right. The footer carries the app label, blurb
// and a deep-link into the live app.

export type WidgetStatus = 'loading' | 'ok' | 'no_data' | 'error';

const STATUS_META: Record<WidgetStatus, { label: string; classes: string }> = {
  ok:      { label: 'Live',    classes: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
  loading: { label: 'Loading', classes: 'text-gray-400 bg-white/5 border-white/10' },
  no_data: { label: 'No data', classes: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
  error:   { label: 'Failed',  classes: 'text-red-300 bg-red-500/10 border-red-500/30' },
};

interface WidgetCardProps {
  label: string;
  blurb: string;
  deepLink: string;
  status: WidgetStatus;
  /** Uppercase caption shown above the headline value, e.g. "Market value". */
  metricLabel?: string;
  /** Headline value, e.g. "CHF 8'450 /m²". */
  stat?: ReactNode;
  /** Optional accent colour for the stat text (e.g. a noise-band hex). */
  statColor?: string;
  error?: string;
  onRetry?: () => void;
  /** The map — MapboxMini / LeafletMini. */
  children: ReactNode;
}

export default function WidgetCard({
  label,
  blurb,
  deepLink,
  status,
  metricLabel,
  stat,
  statColor,
  error,
  onRetry,
  children,
}: WidgetCardProps) {
  const meta = STATUS_META[status];

  return (
    <div className="surface-raised surface-hover rounded-xl overflow-hidden flex flex-col">
      <div className="relative aspect-[16/10] bg-ink-900 overflow-hidden">
        {children}

        {/* Status badge — top-right, every status. */}
        <span
          className={`absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${meta.classes}`}
        >
          {meta.label}
        </span>

        {status === 'loading' && (
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        )}

        {status === 'no_data' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink-900/70 text-amber-300/90">
            <MapPinned size={22} className="text-amber-500/70" />
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              No data at this location
            </span>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink-900/80 text-red-300/90 px-4 text-center">
            <AlertTriangle size={22} className="text-red-500/70" />
            <span className="text-[11px] font-semibold">{error || 'Failed to load'}</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-1 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-semibold border border-white/10 text-gray-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-colors"
              >
                <RefreshCw size={12} />
                Retry
              </button>
            )}
          </div>
        )}

        {/* Headline value — large, over a gradient scrim. Only when live. */}
        {status === 'ok' && stat != null && (
          <div className="absolute inset-x-0 bottom-0 pointer-events-none bg-gradient-to-t from-ink-900/95 via-ink-900/60 to-transparent px-3.5 pt-10 pb-3">
            {metricLabel && (
              <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-300">
                {metricLabel}
              </p>
            )}
            <p
              className="text-2xl sm:text-3xl font-bold tabular-nums leading-none mt-0.5"
              style={{ color: statColor ?? '#22d3ee' }}
            >
              {stat}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-3.5 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-100 truncate">{label}</p>
          <p className="text-[11px] text-gray-500 truncate">{blurb}</p>
        </div>
        <a
          href={deepLink}
          target="_blank"
          rel="noopener noreferrer"
          title={`Open ${label} at this location`}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors flex-shrink-0"
        >
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS — all five widgets still pass valid props (`metricLabel` is optional).

- [ ] **Step 3: Commit**

```bash
git add src/components/reporter/WidgetCard.tsx
git commit -m "feat: show widget value large over the map, move status badge"
```

---

## Task 6: Add `metricLabel` to the five widgets

**Files:**
- Modify: `src/components/reporter/widgets/ValooWidget.tsx`
- Modify: `src/components/reporter/widgets/RoofsWidget.tsx`
- Modify: `src/components/reporter/widgets/RootsWidget.tsx`
- Modify: `src/components/reporter/widgets/SoolarWidget.tsx`
- Modify: `src/components/reporter/widgets/BoomWidget.tsx`

Each widget renders exactly one `<WidgetCard … status={status} …>` (the main
card). Add a `metricLabel` prop on the line immediately after `status={status}`.

- [ ] **Step 1: ValooWidget**

In `ValooWidget.tsx`, find:

```tsx
      status={status}
      stat={priceM2 != null ? `CHF ${priceM2.toLocaleString('de-CH')} /m²` : undefined}
```

Replace with:

```tsx
      status={status}
      metricLabel="Market value"
      stat={priceM2 != null ? `CHF ${priceM2.toLocaleString('de-CH')} /m²` : undefined}
```

- [ ] **Step 2: RoofsWidget**

In `RoofsWidget.tsx`, find:

```tsx
      status={status}
      stat={heightMax != null ? `${heightMax.toFixed(1)} m` : undefined}
```

Replace with:

```tsx
      status={status}
      metricLabel="Building height"
      stat={heightMax != null ? `${heightMax.toFixed(1)} m` : undefined}
```

- [ ] **Step 3: RootsWidget**

In `RootsWidget.tsx`, find:

```tsx
      status={status}
      stat={year != null ? `built ${year}` : undefined}
```

Replace with:

```tsx
      status={status}
      metricLabel="Construction year"
      stat={year != null ? String(year) : undefined}
```

(The `built ` prefix is dropped — the `metricLabel` now carries that meaning,
and the bare year reads as a proper headline number.)

- [ ] **Step 4: SoolarWidget**

In `SoolarWidget.tsx`, find:

```tsx
      status={status}
      stat={yieldKWh != null ? formatKWh(yieldKWh) : undefined}
```

Replace with:

```tsx
      status={status}
      metricLabel="Solar potential"
      stat={yieldKWh != null ? formatKWh(yieldKWh) : undefined}
```

- [ ] **Step 5: BoomWidget**

In `BoomWidget.tsx`, find:

```tsx
      status={status}
      stat={stat}
```

Replace with:

```tsx
      status={status}
      metricLabel="Road noise"
      stat={stat}
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/reporter/widgets/ValooWidget.tsx src/components/reporter/widgets/RoofsWidget.tsx src/components/reporter/widgets/RootsWidget.tsx src/components/reporter/widgets/SoolarWidget.tsx src/components/reporter/widgets/BoomWidget.tsx
git commit -m "feat: give each reporter widget a metric label"
```

---

## Task 7: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS — all suites green, including the new `parcelInfo.test.ts`
(3 tests) and the existing data-layer tests (16 tests).

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS — no errors.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: PASS — no new errors.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS — production build succeeds.

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`, open `/reporter`, search a known Swiss address. Verify:
- Each live card shows the large coloured value with its uppercase metric
  label over the bottom of the map; the status badge sits top-right.
- `loading` / `no_data` / `error` card states still render their overlays.
- The parcel chip strip appears below the grid with address, EGRID, size,
  volume, flats, zone and coordinates (fields with no data are omitted).
- With no `RES_API_TOKEN` set locally, the strip shows "Parcel details
  unavailable" and the cards are unaffected.

---

## Notes for the implementer

- This is the `feat/reporter-card-value-parcel-info` branch off `main`.
- `RES_API_TOKEN` must be set on the showroom Vercel project (Production +
  Preview) for the parcel strip to return data in deployed environments.
- After all tasks pass, follow the swissnovo publish workflow: bump the
  version + release notes, sync the toolbox if a tracked capability changed,
  then commit / push / PR / merge.
