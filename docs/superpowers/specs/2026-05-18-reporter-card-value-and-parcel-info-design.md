# Reporter — Prominent Card Values + Parcel Info Strip

**Date:** 2026-05-18
**App:** showroom
**Branch:** `feat/reporter-card-value-parcel-info`

## Problem

The `/reporter` widget cards work, but two things are weak:

1. **The headline value is buried.** Each card's stat (e.g. `CHF 8'450 /m²`)
   renders as small `text-sm` text in the footer, wedged between the status
   badge and the deep-link icon. There is no label telling the viewer what the
   number *is*.
2. **No parcel context.** The report shows five app views but never states the
   basic facts of the parcel itself — address, EGRID, size, flats, coordinates.

## Goals

- Make each card's value large, high-contrast, and clearly tied to its topic.
- Add a general parcel-info block below the cards, sourced from the RES API.

Non-goals: changing the maps, the data-layer modules, or the widget logic
beyond passing one new label prop.

## Part 1 — Card value as a map overlay

### `WidgetCard.tsx`

The value moves out of the footer and onto the map as a bottom-anchored
overlay over a dark gradient scrim (legible on both the dark Mapbox mini and
the light Leaflet mini).

```
┌────────────────────────────────┐
│ [live map]          ● Live     │  status badge → top-right map overlay
│                                │
│ ░░░░░ gradient scrim ░░░░░░░░░  │
│ MARKET VALUE                   │  metric label — uppercase, ~11px, gray-300
│ CHF 8'450 /m²                  │  value — text-2xl/3xl, bold, topic color
├────────────────────────────────┤
│ Valoo · Property valuation  ↗  │  footer — name + blurb + deep-link
└────────────────────────────────┘
```

New / changed props on `WidgetCard`:

| Prop          | Type        | Notes                                            |
|---------------|-------------|--------------------------------------------------|
| `metricLabel` | `string`    | New. Uppercase caption above the value.          |
| `stat`        | `ReactNode` | Unchanged. Now rendered large in the map overlay.|
| `statColor`   | `string`    | Unchanged. Applied to the large value text.      |

Behaviour:

- The value overlay renders **only when `status === 'ok'` and `stat != null`**.
  For `loading` / `no_data` / `error`, the existing full-map overlays show
  instead and the value overlay is hidden.
- The status badge moves from the footer to a top-right map overlay (absolute,
  same `STATUS_META` styling, small pill). It shows for every status.
- The scrim is a `bg-gradient-to-t from-ink-900/95 via-ink-900/60 to-transparent`
  band across the bottom ~45% of the map, `pointer-events-none`.
- Value text: `text-2xl sm:text-3xl font-bold tabular-nums leading-none`,
  color = `statColor ?? '#22d3ee'`. Label: `text-[11px] uppercase tracking-wider
  font-semibold text-gray-300`.
- Footer simplifies to: app `label` + `blurb` (left), deep-link icon (right).
  The stat and status badge are removed from the footer.

### The five widgets

Each widget already passes `stat` (and sometimes `statColor`) to `WidgetCard`.
Add one `metricLabel` string each:

| Widget         | `metricLabel`        | Example value      |
|----------------|----------------------|--------------------|
| `ValooWidget`  | `Market value`       | `CHF 8'450 /m²`    |
| `RoofsWidget`  | `Building height`    | `18.4 m`           |
| `RootsWidget`  | `Construction year`  | `1973`             |
| `SoolarWidget` | `Solar potential`    | per existing stat  |
| `BoomWidget`   | `Road noise`         | `58 dB`            |

No other widget logic changes. Where a widget currently has no `stat` for a
status it stays as-is (overlay simply does not render).

## Part 2 — Parcel info strip

### Data source — RES API

`POST https://res.zeroo.ch/res_api/parcel_data`

- Body: `{ "lat": <number>, "lng": <number> }`
- Auth: `token` **header** (the RES `res_token`, distinct from the signal
  bearer token).
- Response: a GeoJSON `FeatureCollection`; `features[0].properties` carries the
  parcel attributes.

### Edge function — `api/parcel-data.ts`

New Vercel edge function, modelled on the existing `api/signal-collect.ts`:

- `runtime: "edge"`, same CORS preflight handling.
- Reads `RES_API_TOKEN` from the environment (set on the showroom Vercel
  project). **No baked-in default** — if the var is absent, respond `500` with
  `{ error: "RES_API_TOKEN not configured" }`.
- Accepts `POST` with `{lat,lng}`, validates both are finite numbers
  (rejects `400` otherwise).
- Forwards to the RES `parcel_data` endpoint with header
  `token: <RES_API_TOKEN>` and `Content-Type: application/json`.
- Returns the RES JSON body verbatim with the upstream status, plus CORS
  headers. On a network failure, respond `502`.
- The RES endpoint URL is overridable via `PARCEL_API_URL`, defaulting to
  `https://res.zeroo.ch/res_api/parcel_data`.

### Client module — `src/lib/parcelInfo.ts`

```ts
export interface ParcelInfo {
  address: string | null;     // street line, e.g. "Bahnhofstrasse 1"
  locality: string | null;    // "8001 Zürich ZH" (zip + city + canton)
  egrid: string | null;       // parcel_id
  buildingSizeM2: number | null;   // bldg_size
  buildingVolumeM3: number | null; // bldg_vol_sb3dgdb
  flats: number | null;       // bldg_flats
  zone: string | null;        // cz_abbrev
  lat: number;
  lng: number;
}

export async function fetchParcelInfo(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<ParcelInfo | null>;
```

- `POST`s to `/api/parcel-data`.
- Returns `null` when the request fails, the response has no features, or the
  parcel cannot be identified — callers treat `null` as "no parcel data".
- A pure exported helper `normalizeParcelProps(props, lat, lng): ParcelInfo`
  does the field mapping so it can be unit-tested without a network call.
- Numeric coercion: non-positive / non-finite values normalize to `null`
  (reuse the `num()` pattern from `parcelLookup.ts`).
- `locality` is assembled from `zip` + `cityname` + `canton`, skipping blanks.

### Component — `src/components/reporter/ParcelInfoStrip.tsx`

A self-fetching component: `<ParcelInfoStrip lat={number} lng={number} />`.

- Internally fetches via `fetchParcelInfo` on mount and on lat/lng change,
  aborting the in-flight request on change/unmount.
- States:
  - **loading** — a slim shimmer strip.
  - **error / null** — a quiet one-line "Parcel details unavailable" notice
    (the report is still useful without it; never blocks the cards).
  - **ok** — a wrapping chip strip.
- Chips (each = icon + value, pill-shaped, only rendered when the field is
  non-null):

  | Chip      | Icon (lucide)  | Source field            |
  |-----------|----------------|-------------------------|
  | Address   | `MapPin`       | `address` + `locality`  |
  | EGRID     | `Fingerprint`  | `egrid`                 |
  | Size      | `Ruler`        | `buildingSizeM2` m²     |
  | Volume    | `Box`          | `buildingVolumeM3` m³   |
  | Flats     | `Building2`    | `flats` flats           |
  | Zone      | `Map`          | `zone`                  |
  | Coords    | `Crosshair`    | `lat`, `lng` (6 dp)     |

- Styling matches the existing `surface` cards (same border / radius / dark
  palette). Numbers use `tabular-nums`; thousands formatted via `src/lib/format.ts`.

### Wiring — `ReporterView.tsx`

Render `<ParcelInfoStrip lat lng />` immediately **after** `<ReportGrid>`,
inside the existing `{params && ( … )}` block. It uses the same
`key={lat,lng,regenKey}`-style remount so "Regenerate" re-fetches it too.

## Testing

- `src/lib/__tests__/parcelInfo.test.ts` (new, vitest):
  - `normalizeParcelProps` maps a representative `parcel_data` properties
    object to the expected `ParcelInfo`.
  - Missing / null / zero / negative fields normalize to `null`.
  - `locality` assembly skips blank components.
- Existing data-layer tests stay green; no changes to `parcelLookup.ts` etc.
- Manual: `/reporter` with a known Swiss address — all five cards show the
  large labelled value; the chip strip shows the parcel facts; verify
  `loading` and `no_data` card states still render correctly.

## Files

**New**
- `api/parcel-data.ts`
- `src/lib/parcelInfo.ts`
- `src/lib/__tests__/parcelInfo.test.ts`
- `src/components/reporter/ParcelInfoStrip.tsx`

**Changed**
- `src/components/reporter/WidgetCard.tsx` — value→map overlay, status badge
  →map overlay, footer simplified, `metricLabel` prop.
- `src/components/reporter/widgets/{Valoo,Roofs,Roots,Soolar,Boom}Widget.tsx`
  — pass `metricLabel`.
- `src/components/reporter/ReporterView.tsx` — render `ParcelInfoStrip`.
- `.env.example` — document `RES_API_TOKEN`.

## Deployment note

`RES_API_TOKEN` must be set on the showroom Vercel project (Production +
Preview) before the parcel strip works. Until then the strip degrades
gracefully to "Parcel details unavailable" and the cards are unaffected.
