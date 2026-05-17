# Showroom Reporter v2 — Widget Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace showroom's headless-browser screenshot reporter with 5 live, in-browser widget cards (Valoo, Roofs, Roots, Soolar, Boom) that recreate each app's signature map view at a searched address.

**Architecture:** `/reporter` renders a responsive grid of 5 self-contained widgets. Two thin non-interactive base map components (`MapboxMini`, `LeafletMini`) carry the visual; each widget fetches its own headline stat. No backend report job, no polling.

**Tech Stack:** Vite + React 18 + TypeScript, Tailwind, `mapbox-gl` (Valoo/Roofs), `leaflet` (Roots/Soolar/Boom), `vitest` for the pure data-layer modules.

---

## Refinement of the spec

The design spec (`docs/superpowers/specs/2026-05-18-showroom-reporter-redesign-design.md`) proposed a single GeoServer `GetFeatureInfo` call feeding Valoo+Roofs+Roots. This plan refines that to the lower-risk path the spec listed as fallback:

- **Valoo / Roofs** read `estimated_price_m2` / `bldg_height_max` from their own Mapbox vector tiles via `queryRenderedFeatures` after the map idles — fully client-side, no CORS dependency, the tiles are guaranteed to carry both attributes.
- **Roots** uses GeoServer `GetFeatureInfo` for the construction-year stat (its WMS tiles expose no attributes otherwise). If that call fails, the Roots card still renders the map (the WMS style bakes year labels into the tiles) and the headline stat degrades gracefully to "Construction-year map".

Plain `leaflet` is used imperatively for `LeafletMini` (not `react-leaflet`) — simpler for a tiny non-interactive map.

## File structure

```
showroom/
  package.json                                MODIFY  add deps + test script
  vite.config.ts                              MODIFY  add vitest config
  src/lib/reporterApps.ts                     NEW     5-app registry + deep-link builder
  src/lib/parcelLookup.ts                     NEW     queryRenderedFeatures extract + GeoServer year lookup
  src/lib/solarLookup.ts                      NEW     Sonnendach identify + building summary (from soolar)
  src/lib/noiseSample.ts                      NEW     noise WMTS pixel sampling (from boom)
  src/lib/__tests__/reporterApps.test.ts      NEW
  src/lib/__tests__/parcelLookup.test.ts      NEW
  src/lib/__tests__/solarLookup.test.ts       NEW
  src/lib/__tests__/noiseSample.test.ts       NEW
  src/components/reporter/WidgetCard.tsx      NEW     shared card shell (map slot + footer + status)
  src/components/reporter/MapboxMini.tsx      NEW     non-interactive Mapbox base
  src/components/reporter/LeafletMini.tsx     NEW     non-interactive Leaflet base
  src/components/reporter/widgets/ValooWidget.tsx   NEW
  src/components/reporter/widgets/RoofsWidget.tsx   NEW
  src/components/reporter/widgets/RootsWidget.tsx   NEW
  src/components/reporter/widgets/SoolarWidget.tsx  NEW
  src/components/reporter/widgets/BoomWidget.tsx    NEW
  src/components/reporter/ReportGrid.tsx      NEW     grid of the 5 widgets
  src/components/reporter/ReporterView.tsx    MODIFY  rewrite body to render ReportGrid
  src/services/reporterService.ts             DELETE
  src/components/reporter/ReportCard.tsx       DELETE
  src/data/releaseNotes.ts                    MODIFY  add release entry
```

---

## Task 1: Dependencies and vitest setup

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`

- [ ] **Step 1: Install runtime + dev deps**

```bash
cd /Users/joe/Documents/local_dev/swissnovo/showroom
npm install mapbox-gl@^3.18.0 leaflet@^1.9.4
npm install -D @types/leaflet@^1.9.8 vitest@^2.1.0 jsdom@^25.0.0
```
(`mapbox-gl` ships its own types.)

- [ ] **Step 2: Add the test script to `package.json`**

In `"scripts"`, add: `"test": "vitest run"`.

- [ ] **Step 3: Add vitest config to `vite.config.ts`**

Current file is a minimal Vite config. Add a `test` block:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: { exclude: ['lucide-react'] },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```
Add `/// <reference types="vitest" />` at the top if TS complains about the `test` key.

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: PASS (no usages yet, just confirms deps resolve).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "build: add mapbox-gl, leaflet and vitest to showroom"
```

---

## Task 2: App registry — `lib/reporterApps.ts`

The registry holds the 5 apps' identity, base URL and deep-link builder. It is the single source of truth for "which apps does the reporter show".

**Files:**
- Create: `src/lib/reporterApps.ts`
- Test: `src/lib/__tests__/reporterApps.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { REPORTER_APPS, deepLink } from '../reporterApps';

describe('reporterApps', () => {
  it('lists the 5 reporter apps in order', () => {
    expect(REPORTER_APPS.map((a) => a.id)).toEqual([
      'valoo', 'roofs', 'roots', 'soolar', 'boom',
    ]);
  });

  it('builds a ?lat&lng deep link for an app', () => {
    const valoo = REPORTER_APPS[0];
    expect(deepLink(valoo, 47.3769, 8.5417)).toBe(
      'https://swissnovo-valoo.vercel.app/?lat=47.376900&lng=8.541700',
    );
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run src/lib/__tests__/reporterApps.test.ts`
Expected: FAIL — cannot resolve `../reporterApps`.

- [ ] **Step 3: Implement `reporterApps.ts`**

```ts
export type ReporterAppId = 'valoo' | 'roofs' | 'roots' | 'soolar' | 'boom';

export interface ReporterApp {
  id: ReporterAppId;
  label: string;
  /** One-line description of what the card shows. */
  blurb: string;
  /** Live app base URL (no trailing slash). */
  baseUrl: string;
}

export const REPORTER_APPS: ReporterApp[] = [
  { id: 'valoo',  label: 'Valoo',  blurb: 'Parcel valuation',   baseUrl: 'https://swissnovo-valoo.vercel.app' },
  { id: 'roofs',  label: 'Roofs',  blurb: 'Building height',    baseUrl: 'https://swissnovo-roofs.vercel.app' },
  { id: 'roots',  label: 'Roots',  blurb: 'Construction year',  baseUrl: 'https://swissnovo-roots.vercel.app' },
  { id: 'soolar', label: 'Soolar', blurb: 'Solar PV potential', baseUrl: 'https://swissnovo-soolar.vercel.app' },
  { id: 'boom',   label: 'Boom',   blurb: 'Noise exposure',     baseUrl: 'https://swissnovo-boom.vercel.app' },
];

export function deepLink(app: ReporterApp, lat: number, lng: number): string {
  return `${app.baseUrl}/?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`;
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx vitest run src/lib/__tests__/reporterApps.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/reporterApps.ts src/lib/__tests__/reporterApps.test.ts
git commit -m "feat(reporter): add the 5-app registry"
```

---

## Task 3: Parcel lookup — `lib/parcelLookup.ts`

Two responsibilities: (a) a pure `extractParcelStats(props)` that normalises a Mapbox parcel feature's properties, used by Valoo/Roofs; (b) `fetchConstructionYear(lat,lng)` — a GeoServer `GetFeatureInfo` request for Roots.

**Files:**
- Create: `src/lib/parcelLookup.ts`
- Test: `src/lib/__tests__/parcelLookup.test.ts`

- [ ] **Step 1: VERIFY field names against the live GeoServer (no code yet)**

Run a real GetFeatureInfo against `project_res:parcel_2025_07` over central Zürich and inspect property names — confirm the construction-year field name and that JSON is accepted:

```bash
curl -s 'https://gs-contabo-extra.zeroo.ch/geoserver/project_res/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&LAYERS=project_res:parcel_2025_07&QUERY_LAYERS=project_res:parcel_2025_07&SRS=EPSG:4326&BBOX=8.5409,47.3761,8.5425,47.3777&WIDTH=101&HEIGHT=101&X=50&Y=50&INFO_FORMAT=application/json&FEATURE_COUNT=1' | head -c 1500
```
Record the exact construction-year property key (candidates: `bldg_constr_yr`, `bldg_year_max`, `constr_year`, `gbauj`). Use it in Step 3's `YEAR_KEYS`. If the request errors or JSON is rejected, note it — `fetchConstructionYear` then returns `null` and Roots degrades gracefully.

- [ ] **Step 2: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { extractParcelStats } from '../parcelLookup';

describe('extractParcelStats', () => {
  it('reads price and height from parcel properties', () => {
    const s = extractParcelStats({
      estimated_price_m2: 8450.4,
      bldg_height_max: 23.42,
      bldg_height_min: 11.2,
    });
    expect(s.priceM2).toBe(8450);
    expect(s.heightMax).toBeCloseTo(23.4, 1);
  });

  it('returns nulls for missing or zero values', () => {
    const s = extractParcelStats({ estimated_price_m2: 0 });
    expect(s.priceM2).toBeNull();
    expect(s.heightMax).toBeNull();
  });

  it('tolerates string-encoded numbers', () => {
    const s = extractParcelStats({ estimated_price_m2: '7200' });
    expect(s.priceM2).toBe(7200);
  });
});
```

- [ ] **Step 3: Implement `parcelLookup.ts`**

```ts
// Parcel-level data lookups for the reporter widgets.
//
// Valoo and Roofs read the price / height attributes straight off the Mapbox
// `parcel_2025_07` vector tiles (extractParcelStats). Roots has no Mapbox map,
// so its construction-year stat comes from a GeoServer GetFeatureInfo call.

export interface ParcelStats {
  priceM2: number | null;     // estimated_price_m2, CHF/m²
  heightMax: number | null;   // bldg_height_max, m
  heightMin: number | null;   // bldg_height_min, m
}

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : null;
}

/** Normalise a Mapbox parcel feature's `properties` into typed stats. */
export function extractParcelStats(props: Record<string, unknown>): ParcelStats {
  const price = num(props.estimated_price_m2);
  const hMax = num(props.bldg_height_max);
  const hMin = num(props.bldg_height_min);
  return {
    priceM2: price === null ? null : Math.round(price),
    heightMax: hMax === null ? null : Math.round(hMax * 10) / 10,
    heightMin: hMin === null ? null : Math.round(hMin * 10) / 10,
  };
}

// Construction-year property key — set from the Step 1 verification.
const YEAR_KEYS = ['bldg_constr_yr', 'bldg_year_max', 'constr_year', 'gbauj'];
const GEOSERVER_WMS = 'https://gs-contabo-extra.zeroo.ch/geoserver/project_res/wms';

/** GeoServer GetFeatureInfo for the construction year at a point. Returns null on any failure. */
export async function fetchConstructionYear(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<number | null> {
  const d = 0.0008;
  const params = new URLSearchParams({
    SERVICE: 'WMS', VERSION: '1.1.1', REQUEST: 'GetFeatureInfo',
    LAYERS: 'project_res:parcel_2025_07',
    QUERY_LAYERS: 'project_res:parcel_2025_07',
    SRS: 'EPSG:4326',
    BBOX: `${lng - d},${lat - d},${lng + d},${lat + d}`,
    WIDTH: '101', HEIGHT: '101', X: '50', Y: '50',
    INFO_FORMAT: 'application/json', FEATURE_COUNT: '1',
  });
  try {
    const res = await fetch(`${GEOSERVER_WMS}?${params}`, { signal });
    if (!res.ok) return null;
    const json = await res.json();
    const props = json?.features?.[0]?.properties ?? {};
    for (const k of YEAR_KEYS) {
      const y = num(props[k]);
      if (y && y > 1200 && y <= new Date().getFullYear()) return Math.round(y);
    }
    return null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx vitest run src/lib/__tests__/parcelLookup.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/parcelLookup.ts src/lib/__tests__/parcelLookup.test.ts
git commit -m "feat(reporter): add parcel stat extraction + GeoServer year lookup"
```

---

## Task 4: Solar lookup — `lib/solarLookup.ts`

Port the proven Sonnendach helpers from `soolar/src/lib/solar.ts`, trimmed to what the widget needs: `wgs84ToLv95`, `identifySolarAt`, `summarizeBuildings`, `formatKWh`, plus a convenience `totalYieldAt(lat,lng)`.

**Files:**
- Create: `src/lib/solarLookup.ts`
- Test: `src/lib/__tests__/solarLookup.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { summarizeYield, formatKWh } from '../solarLookup';

describe('solarLookup', () => {
  it('sums stromertrag across roof features', () => {
    const total = summarizeYield([
      { attributes: { gwr_egid: 1, stromertrag: 6000, flaeche: 40 } },
      { attributes: { gwr_egid: 1, stromertrag: 8000, flaeche: 55 } },
    ]);
    expect(total).toBe(14000);
  });

  it('returns 0 for no features', () => {
    expect(summarizeYield([])).toBe(0);
  });

  it('formats kWh into MWh', () => {
    expect(formatKWh(14000)).toBe('14.0 MWh');
    expect(formatKWh(800)).toBe('800 kWh');
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run src/lib/__tests__/solarLookup.test.ts`
Expected: FAIL — cannot resolve `../solarLookup`.

- [ ] **Step 3: Implement `solarLookup.ts`**

Copy `wgs84ToLv95`, `identifySolarAt`, the `SolarRoofFeature`/`SolarRoofProperties` types, and `formatKWh` verbatim from `soolar/src/lib/solar.ts` (lines 7–94, 211–215). Add an `AbortSignal` param to `identifySolarAt`'s `fetch`. Then add:

```ts
/** Sum PV yield (stromertrag, kWh/yr) across all roof features at a point. */
export function summarizeYield(features: SolarRoofFeature[]): number {
  let total = 0;
  for (const f of features) {
    const p = (f.attributes ?? f.properties ?? {}) as SolarRoofProperties;
    if (typeof p.stromertrag === 'number' && Number.isFinite(p.stromertrag)) {
      total += p.stromertrag;
    }
  }
  return total;
}

/** Convenience: identify + sum. Returns total kWh/yr, or null if no roofs. */
export async function totalYieldAt(
  lat: number, lng: number, signal?: AbortSignal,
): Promise<number | null> {
  const features = await identifySolarAt(lat, lng, signal);
  if (features.length === 0) return null;
  return summarizeYield(features);
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx vitest run src/lib/__tests__/solarLookup.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/solarLookup.ts src/lib/__tests__/solarLookup.test.ts
git commit -m "feat(reporter): add Sonnendach solar-yield lookup"
```

---

## Task 5: Noise sampling — `lib/noiseSample.ts`

Port the proven WMTS pixel-sampling from `boom/src/lib/noise.ts`, trimmed to what the widget needs: the WMTS template, `NOISE_BANDS`, `nearestBand`, `lngLatToTilePixel`, `loadTile`, `sampleNoiseAt`. Drop the LSV legal-limits block (`assessNoise`, `SENSITIVITY_LEVELS`, `LIMITS`, `VERDICT_STYLE`) — the card only shows the dB band.

**Files:**
- Create: `src/lib/noiseSample.ts`
- Test: `src/lib/__tests__/noiseSample.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { nearestBand } from '../noiseSample';

describe('noiseSample', () => {
  it('snaps an exact ramp colour to its band', () => {
    const band = nearestBand(240, 109, 51); // 55–59.9 dB swatch
    expect(band?.label).toBe('55–59.9 dB');
  });

  it('rejects an off-ramp colour', () => {
    expect(nearestBand(12, 200, 12)).toBeNull(); // bright green, not on ramp
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run src/lib/__tests__/noiseSample.test.ts`
Expected: FAIL — cannot resolve `../noiseSample`.

- [ ] **Step 3: Implement `noiseSample.ts`**

Copy from `boom/src/lib/noise.ts`: the file header, lines 61–63 (`wmtsTemplate`), lines 66–208 (`NoiseBand`, `NOISE_BANDS`, tile maths, `loadTile`, `nearestBand`, `NoiseSample`, `sampleNoiseAt`). Add the default layer constant and a convenience:

```ts
/** Road-traffic day noise — the default layer the reporter card samples. */
export const REPORTER_NOISE_WMTS = 'ch.bafu.laerm-strassenlaerm_tag';

/** Sample the road-day noise band at a point. Returns the band, or null if quiet/unmapped. */
export async function noiseBandAt(lat: number, lng: number) {
  const { band } = await sampleNoiseAt(lat, lng, REPORTER_NOISE_WMTS);
  return band;
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx vitest run src/lib/__tests__/noiseSample.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/noiseSample.ts src/lib/__tests__/noiseSample.test.ts
git commit -m "feat(reporter): add BAFU noise WMTS sampling"
```

---

## Task 6: Card shell — `components/reporter/WidgetCard.tsx`

A presentational shell every widget renders into: a 16:10 map slot, a footer (app label · blurb · headline stat · status badge · external-link), and per-card loading / no-data / error overlays.

**Files:**
- Create: `src/components/reporter/WidgetCard.tsx`

- [ ] **Step 1: Implement `WidgetCard.tsx`**

A component with this contract:

```tsx
export type WidgetStatus = 'loading' | 'ok' | 'no_data' | 'error';

interface WidgetCardProps {
  label: string;          // "Valoo"
  blurb: string;          // "Parcel valuation"
  deepLink: string;       // live app URL at ?lat&lng
  status: WidgetStatus;   // drives the badge + overlays
  stat?: React.ReactNode; // headline value, e.g. "CHF 8'450 /m²"
  error?: string;
  onRetry?: () => void;
  children: React.ReactNode; // the map (MapboxMini / LeafletMini)
}
```

Behaviour:
- The map area is `aspect-[16/10]`, `position: relative`, dark `bg-ink-900`, rounded, `overflow-hidden`. `children` (the map) fills it absolutely.
- While `status === 'loading'`: a `animate-shimmer` overlay sits above the map.
- `status === 'no_data'`: amber overlay, `MapPinned` icon, "No data at this location".
- `status === 'error'`: red overlay, `AlertTriangle` icon, the `error` text, and a "Retry" button wired to `onRetry`.
- Footer row (reuse the existing `ReportCard.tsx` footer styling — `surface-raised`, `px-3.5 py-3`): left = `label` (bold) + `blurb` (tiny gray); right = `stat` (cyan, bold) + a status badge + an `ExternalLink` icon `<a href={deepLink} target="_blank" rel="noopener noreferrer">`.
- Status badge meta: `ok`→emerald "Live", `loading`→gray "Loading", `no_data`→amber "No data", `error`→red "Failed". Reuse the `STATUS_META` colour classes from the old `ReportCard.tsx`.

Outer wrapper: `surface-raised surface-hover rounded-xl overflow-hidden flex flex-col`.

- [ ] **Step 2: Verify it typechecks**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/reporter/WidgetCard.tsx
git commit -m "feat(reporter): add WidgetCard shell"
```

---

## Task 7: Mapbox base — `components/reporter/MapboxMini.tsx`

A non-interactive Mapbox GL map for the Valoo and Roofs widgets.

**Files:**
- Create: `src/components/reporter/MapboxMini.tsx`

- [ ] **Step 1: Implement `MapboxMini.tsx`**

Contract:

```tsx
interface MapboxMiniProps {
  lat: number;
  lng: number;
  zoom?: number;        // default 17
  pitch?: number;       // default 0
  styleUrl: string;     // e.g. 'mapbox://styles/mapbox/light-v11'
  /** Called once on map 'load' — add sources/layers here. */
  onLoad: (map: mapboxgl.Map) => void;
  /** Called after the map first goes 'idle' — read rendered features here. */
  onIdle?: (map: mapboxgl.Map) => void;
}
```

Implementation notes:
- `import mapboxgl from 'mapbox-gl';` and `import 'mapbox-gl/dist/mapbox-gl.css';`.
- Set `mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN` (module scope, guarded so it only sets once).
- A `useRef` div container; in a `useEffect` keyed on `lat,lng` create the map:
  `new mapboxgl.Map({ container, style: styleUrl, center: [lng, lat], zoom, pitch, interactive: false, attributionControl: false })`.
  `interactive: false` disables all drag/zoom/rotate at once.
- On `'load'`: call `onLoad(map)`, then add a DOM marker at `[lng, lat]` — a cyan dot (`new mapboxgl.Marker({ color: '#22d3ee' })` or a custom element matching the brainstorm pin).
- On the first `'idle'` after load: call `onIdle?.(map)` once (guard with a ref).
- Cleanup: `map.remove()` on unmount.
- The container div is `absolute inset-0` so it fills `WidgetCard`'s map slot.
- If `VITE_MAPBOX_TOKEN` is missing, render nothing and let the widget surface an error (the widget checks the token too — see Task 9).

- [ ] **Step 2: Verify it typechecks**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/reporter/MapboxMini.tsx
git commit -m "feat(reporter): add non-interactive MapboxMini base"
```

---

## Task 8: Leaflet base — `components/reporter/LeafletMini.tsx`

A non-interactive Leaflet map for the Roots, Soolar and Boom widgets.

**Files:**
- Create: `src/components/reporter/LeafletMini.tsx`

- [ ] **Step 1: Implement `LeafletMini.tsx`**

Contract:

```tsx
interface LeafletMiniProps {
  lat: number;
  lng: number;
  zoom?: number;   // default 18
  /** Add overlay tile layers here (WMS / WMTS). Return a cleanup if needed. */
  onReady: (map: L.Map) => void;
}
```

Implementation notes:
- `import L from 'leaflet';` and `import 'leaflet/dist/leaflet.css';`.
- `useRef` container div; `useEffect` keyed on `lat,lng`:
  `L.map(container, { center: [lat, lng], zoom, zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false })`.
- Add the CartoDB light basemap: `L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map)`.
- Call `onReady(map)` so the widget can add its overlay.
- Add a cyan circle marker at the point: `L.circleMarker([lat,lng], { radius: 6, color: '#fff', weight: 2, fillColor: '#22d3ee', fillOpacity: 1 }).addTo(map)`.
- Cleanup: `map.remove()` on unmount.
- Container div `absolute inset-0`.

- [ ] **Step 2: Verify it typechecks**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/reporter/LeafletMini.tsx
git commit -m "feat(reporter): add non-interactive LeafletMini base"
```

---

## Task 9: Valoo widget — `widgets/ValooWidget.tsx`

**Files:**
- Create: `src/components/reporter/widgets/ValooWidget.tsx`

- [ ] **Step 1: Implement `ValooWidget.tsx`**

Props: `{ lat: number; lng: number }`. Local state: `status: WidgetStatus`, `priceM2: number | null`, `error?: string`, plus a `reloadKey` number for retry.

- If `!import.meta.env.VITE_MAPBOX_TOKEN`: render `WidgetCard` with `status='error'`, `error='Mapbox token not configured'`.
- Render `<WidgetCard label="Valoo" blurb="Parcel valuation" deepLink={deepLink(REPORTER_APPS[0],lat,lng)} status={status} stat={priceM2 && \`CHF ${priceM2.toLocaleString('de-CH')} /m²\`} ...>`.
- Inside, render `<MapboxMini key={reloadKey} lat lng zoom={17} styleUrl="mapbox://styles/mapbox/light-v11" onLoad={addLayers} onIdle={readPrice} />`.
- `addLayers(map)` — add the `parcel-tiles` vector source and the `parcel-fill` + `parcel-outline` layers, copied from `valoo/src/components/ParcelMap.tsx:254–312` (source url `https://res-mbtiles-x.gisjoe.com/parcel_2025_07_z12_16`, `source-layer: 'parcel_2025_07'`, the 11-class `estimated_price_m2` step ramp, fill-opacity 0.7). Omit hover/select/label layers — not needed on a static card.
- `readPrice(map)` — `const f = map.queryRenderedFeatures(map.project([lng,lat]), { layers: ['parcel-fill'] })[0];` if found, `extractParcelStats(f.properties).priceM2` → set `priceM2` + `status='ok'`; else `status='no_data'`.
- Wrap `addLayers`/`readPrice` so a thrown error sets `status='error'`.
- Retry: `onRetry` bumps `reloadKey` and resets `status='loading'`.

- [ ] **Step 2: Verify it typechecks**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/reporter/widgets/ValooWidget.tsx
git commit -m "feat(reporter): add Valoo valuation widget"
```

---

## Task 10: Roofs widget — `widgets/RoofsWidget.tsx`

**Files:**
- Create: `src/components/reporter/widgets/RoofsWidget.tsx`

- [ ] **Step 1: Implement `RoofsWidget.tsx`**

Same structure as `ValooWidget`, with these differences:
- `label="Roofs"`, `blurb="Building height"`, `deepLink(REPORTER_APPS[1], …)`.
- `<MapboxMini zoom={17.5} pitch={50} styleUrl="mapbox://styles/mapbox/streets-v12" …>` — the pitch gives the 3D roof read.
- `addLayers(map)` adds the `parcel-tiles` source (`url` as in Task 9) and a `parcel-3d` `fill-extrusion` layer copied from `roofs/src/components/ParcelMap.tsx:206–242` — the `bldg_height_max` step colour ramp, `fill-extrusion-height: ['get','bldg_height_max']`, `fill-extrusion-opacity: 0.85`. Also add a flat `parcel-fill` (height step ramp, `valoo`-style) as the queryable layer, OR query `parcel-3d` directly.
- `readHeight(map)` — `queryRenderedFeatures` against the extrusion layer; `extractParcelStats(props).heightMax` → stat string `${heightMax.toFixed(1)} m`; null → `no_data`.

- [ ] **Step 2: Verify it typechecks**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/reporter/widgets/RoofsWidget.tsx
git commit -m "feat(reporter): add Roofs building-height widget"
```

---

## Task 11: Roots widget — `widgets/RootsWidget.tsx`

**Files:**
- Create: `src/components/reporter/widgets/RootsWidget.tsx`

- [ ] **Step 1: Implement `RootsWidget.tsx`**

Props `{ lat, lng }`. Uses `LeafletMini`.
- `label="Roots"`, `blurb="Construction year"`, `deepLink(REPORTER_APPS[2], …)`.
- `<LeafletMini key={reloadKey} lat lng zoom={18} onReady={addWms} />`.
- `addWms(map)` — add the GeoServer WMS overlay, copied from `roots/src/components/Map.tsx:122–129`:
  `L.tileLayer.wms('https://gs-contabo-extra.zeroo.ch/geoserver/project_res/wms?', { layers: 'project_res:parcel_2025_07', styles: 'parcel_by_bldg_constr_yr_with_label', format: 'image/png8', transparent: true }).addTo(map)`.
- On mount, `useEffect` calls `fetchConstructionYear(lat, lng)` (from `parcelLookup.ts`):
  - a year → `stat = \`built ${year}\``, `status='ok'`.
  - `null` → `status='ok'` still (the map itself shows the year labels), `stat` undefined, `blurb` shown alone. The card is never an error purely because the year lookup returned null — the map is the deliverable.
- `status='error'` only if the WMS layer fails to load (listen to the Leaflet layer `'tileerror'` — if the first tile errors, set error). Keep this simple: a `tileerror` on the WMS layer within the first few seconds → `status='error'` with retry.

- [ ] **Step 2: Verify it typechecks**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/reporter/widgets/RootsWidget.tsx
git commit -m "feat(reporter): add Roots construction-year widget"
```

---

## Task 12: Soolar widget — `widgets/SoolarWidget.tsx`

**Files:**
- Create: `src/components/reporter/widgets/SoolarWidget.tsx`

- [ ] **Step 1: Implement `SoolarWidget.tsx`**

Props `{ lat, lng }`. Uses `LeafletMini`.
- `label="Soolar"`, `blurb="Solar PV potential"`, `deepLink(REPORTER_APPS[3], …)`.
- `<LeafletMini key={reloadKey} lat lng zoom={19} onReady={addOverlay} />`.
- `addOverlay(map)` — add the Sonnendach WMTS overlay:
  `L.tileLayer('https://wmts.geo.admin.ch/1.0.0/ch.bfe.solarenergie-eignung-daecher/default/current/3857/{z}/{x}/{y}.png', { opacity: 0.85, maxNativeZoom: 20 }).addTo(map)`.
- On mount `useEffect` calls `totalYieldAt(lat, lng)` (from `solarLookup.ts`):
  - a number → `stat = formatKWh(total)` (e.g. "14.0 MWh"), `status='ok'`.
  - `null` → `status='no_data'` (no roof at this point).
  - throw → `status='error'` with retry.

- [ ] **Step 2: Verify it typechecks**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/reporter/widgets/SoolarWidget.tsx
git commit -m "feat(reporter): add Soolar PV-potential widget"
```

---

## Task 13: Boom widget — `widgets/BoomWidget.tsx`

**Files:**
- Create: `src/components/reporter/widgets/BoomWidget.tsx`

- [ ] **Step 1: Implement `BoomWidget.tsx`**

Props `{ lat, lng }`. Uses `LeafletMini`.
- `label="Boom"`, `blurb="Road-noise exposure"`, `deepLink(REPORTER_APPS[4], …)`.
- `<LeafletMini key={reloadKey} lat lng zoom={18} onReady={addOverlay} />`.
- `addOverlay(map)` — add the noise WMTS overlay using `wmtsTemplate(REPORTER_NOISE_WMTS)` from `noiseSample.ts`:
  `L.tileLayer(wmtsTemplate(REPORTER_NOISE_WMTS), { opacity: 0.7 }).addTo(map)`.
- On mount `useEffect` calls `noiseBandAt(lat, lng)`:
  - a band → `stat = band.label` (e.g. "55–59.9 dB"), `status='ok'`. Optionally tint the stat with `band.hex`.
  - `null` → `status='ok'` with `stat='< 40 dB'` (genuinely quiet — not an error or missing data).
  - throw → `status='error'` with retry.

- [ ] **Step 2: Verify it typechecks**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/reporter/widgets/BoomWidget.tsx
git commit -m "feat(reporter): add Boom noise-exposure widget"
```

---

## Task 14: Report grid — `components/reporter/ReportGrid.tsx`

**Files:**
- Create: `src/components/reporter/ReportGrid.tsx`

- [ ] **Step 1: Implement `ReportGrid.tsx`**

Props `{ lat: number; lng: number }`. Renders the 5 widgets in a responsive grid:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <ValooWidget  lat={lat} lng={lng} />
  <RoofsWidget  lat={lat} lng={lng} />
  <RootsWidget  lat={lat} lng={lng} />
  <SoolarWidget lat={lat} lng={lng} />
  <BoomWidget   lat={lat} lng={lng} />
</div>
```

Each widget owns its own lifecycle, so `ReportGrid` is purely layout. The parent `key`s the grid on `lat,lng` so a new search remounts all widgets fresh.

- [ ] **Step 2: Verify it typechecks**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/reporter/ReportGrid.tsx
git commit -m "feat(reporter): add ReportGrid layout"
```

---

## Task 15: Rewrite ReporterView, delete the old screenshot path

**Files:**
- Modify: `src/components/reporter/ReporterView.tsx`
- Delete: `src/services/reporterService.ts`
- Delete: `src/components/reporter/ReportCard.tsx`

- [ ] **Step 1: Rewrite `ReporterView.tsx`**

Keep the existing structure (Navbar, ReleaseNotesButton, the `parseParams`/`?lat&lng&q` handling, the `isGeocodingConfigured` warning, the `AddressSearch` block with the `sendAddressSearchSignal` call, the location header bar with the address + coords, the empty state). Replace the report body:

- Remove the imports of `generateReport`/`ReporterReport` and `ReportCard`.
- Remove `report`, `loading`, `error` state and the `runReport`/`generateReport` polling logic and `SkeletonGrid`.
- When `params` is set, render `<ReportGrid key={\`${params.lat},${params.lng}\`} lat={params.lat} lng={params.lng} />`.
- The "Regenerate" button becomes a remount: keep a `regenKey` state; the button bumps it; include it in the `ReportGrid` key. Drop the `loading` spinner state (each card shows its own).
- Update the intro copy: "a side-by-side capture of every map-first SwissNovo app" → "live map widgets recreating five SwissNovo apps — valuation, building height, construction year, solar potential and noise."

- [ ] **Step 2: Delete the dead files**

```bash
git rm src/services/reporterService.ts src/components/reporter/ReportCard.tsx
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run build`
Expected: PASS — no dangling imports of the deleted files.

- [ ] **Step 4: Commit**

```bash
git add src/components/reporter/ReporterView.tsx
git commit -m "feat(reporter): render live widget grid; remove screenshot service"
```

---

## Task 16: Full verification

- [ ] **Step 1: Run the test suite**

Run: `npm run test`
Expected: PASS — all suites (reporterApps, parcelLookup, solarLookup, noiseSample) green.

- [ ] **Step 2: Typecheck + build**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: all PASS.

- [ ] **Step 3: Dev-server smoke test**

Run `npm run dev`, open `/reporter`, search a central Zürich address (e.g. "Bahnhofstrasse 1, Zürich"). Confirm: 5 cards render; Valoo shows a CHF/m² value; Roofs shows a 3D parcel + a height in metres; Roots shows the construction-year WMS tiles; Soolar shows the Sonnendach overlay + an MWh value; Boom shows the noise overlay + a dB band. Confirm a card outside Switzerland degrades to "No data" without breaking the others. Confirm no network call to `res.zeroo.ch/reporter` in the Network tab.

- [ ] **Step 4: Commit any fixes from the smoke test**

```bash
git add -A && git commit -m "fix(reporter): smoke-test corrections"
```
(Skip if nothing needed fixing.)

---

## Task 17: Release notes + version bump

**Files:**
- Modify: `src/data/releaseNotes.ts`
- Modify: `package.json`

- [ ] **Step 1: Bump the version**

`package.json` `"version"` `0.1.0` → `0.2.0`.

- [ ] **Step 2: Add the release-notes entry**

Prepend a new entry to the `RELEASES` array in `src/data/releaseNotes.ts`, matching the existing entry shape (check the file for the exact `Release` type — `version`, `date`, `title`, `items`/`highlights`). Content:
- version `0.2.0`, today's date, title "Live Reporter".
- Notes: the reporter now renders five live, in-browser map widgets (Valoo valuation, Roofs building height, Roots construction year, Soolar PV potential, Boom noise) instead of headless-browser screenshots; each card loads independently — no more multi-minute waits.

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add package.json src/data/releaseNotes.ts
git commit -m "chore: release showroom v0.2.0 — Live Reporter"
```

---

## Task 18: Publish

- [ ] **Step 1: Push the branch**

```bash
git push -u origin feat/reporter-widgets
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "Showroom Reporter v2 — live widget cards" --body "<summary + test plan>"
```

- [ ] **Step 3: Merge**

```bash
gh pr merge --squash --delete-branch
```

- [ ] **Step 4: Toolbox check**

The `/reporter` route already exists, so no new capability is added to the toolbox capabilities matrix. Confirm no matrix update is needed (the reporter row, if present, is unchanged). No toolbox commit expected.

---

## Self-review notes

- **Spec coverage:** 5 widgets (Tasks 9–13) ✓; non-interactive bases (Tasks 7–8) ✓; decoupled stats (Tasks 3–5) ✓; compact-grid card UX with per-card loading/no-data/error (Task 6, 14) ✓; deletion of `reporterService.ts` + `ReportCard.tsx` (Task 15) ✓; `AddressSearch`/`signalService` kept (Task 15) ✓; publish flow (Tasks 17–18) ✓. The spec's "open verification items" map to Task 3 Step 1 (GeoServer) and the Task 16 smoke test (tileset access, CORS).
- **Spec deviation:** data flow refined — `queryRenderedFeatures` is primary for Valoo/Roofs instead of GeoServer (documented at the top of this plan). `project_RES` reporter endpoint left in place per spec.
- **Type consistency:** `WidgetStatus` (Task 6) is the status union used by every widget; `ParcelStats`/`extractParcelStats` (Task 3) consumed by Tasks 9–10; `deepLink`/`REPORTER_APPS` (Task 2) consumed by Tasks 9–13; `formatKWh`/`totalYieldAt` (Task 4) by Task 12; `wmtsTemplate`/`REPORTER_NOISE_WMTS`/`noiseBandAt` (Task 5) by Task 13.
