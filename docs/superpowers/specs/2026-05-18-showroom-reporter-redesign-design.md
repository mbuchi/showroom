# Showroom Reporter v2 — Design

**Date:** 2026-05-18
**App:** `showroom` (`/reporter` page)
**Status:** Approved — ready for implementation plan

## Problem

The current `/reporter` feature sends a searched address to a backend
(`https://res.zeroo.ch/reporter`, implemented in `project_RES`) that drives a
headless browser to visit 8 map-first SwissNovo apps and screenshot each one.
The frontend polls that endpoint for up to 10 minutes.

This is unreliable: cold captures run sequentially and are slow, the headless
browser must authenticate against each app, and the resulting screenshots
"didn't work well." The whole pipeline is fragile.

## Goal

For a searched Swiss address, render a row of **live, in-browser widget cards**
— each one a real mini-map at that location plus the signature summary stat of
one SwissNovo app — recreated from the apps' own rendering approach instead of
screenshotted. No headless browser, no polling, no backend report job.

## Scope

Exactly **5 widgets**, chosen as five genuinely distinct geospatial
perspectives on one address:

| Widget | App    | Map lib | Headline stat            |
|--------|--------|---------|--------------------------|
| Valoo  | valoo  | Mapbox  | CHF X'XXX /m² (parcel)   |
| Roofs  | roofs  | Mapbox  | XX.X m (building height) |
| Roots  | roots  | Leaflet | built YYYY (constr. year)|
| Soolar | soolar | Leaflet | XX MWh/yr (PV yield)     |
| Boom   | boom   | Leaflet | XX dB(A) (noise)         |

Redundant parcel-only apps (footprint/geopool/groove) and apps that need more
than a single point (proom CRM, scoore distance-matrix) are intentionally
excluded.

## Architecture

`/reporter` is rewritten. The address-search flow is unchanged: the user picks
an address, the app navigates to `/reporter?lat=&lng=&q=`, and an
address-search signal is fired (`signalService.ts`). The page stays behind
showroom's existing sign-in gate, but the widgets themselves only call public
APIs — no bearer token is needed for the report.

```
ReporterView
  └─ ReportGrid          (responsive grid-cols 1 / 2 / 3)
       ├─ ValooWidget    (Mapbox)
       ├─ RoofsWidget    (Mapbox)
       ├─ RootsWidget    (Leaflet)
       ├─ SoolarWidget   (Leaflet)
       └─ BoomWidget     (Leaflet)
```

New dependencies for showroom: `mapbox-gl` (valoo, roofs) and
`leaflet` + `react-leaflet` (roots, soolar, boom).

## Components

### Base map components

Two thin, non-interactive base components keep each widget small:

- **`<MapboxMini>`** — a Mapbox GL canvas centered on the pin, with `drag`,
  `scrollZoom`, `doubleClickZoom` and rotation disabled. Renders a fixed
  "report snapshot" framing. Used by Valoo and Roofs.
- **`<LeafletMini>`** — a Leaflet canvas, equivalently non-interactive
  (`dragging`, `scrollWheelZoom`, `zoomControl` etc. off). Used by Roots,
  Soolar and Boom.

Maps are deliberately non-interactive: it keeps 5 simultaneous maps light and
gives a clean snapshot. Full interactivity is one click away via each card's
"open in app" deep-link.

### The 5 widgets

Each widget is `<XxxWidget lat lng />`, roughly 120–180 lines, owning its own
data fetch and visual.

- **ValooWidget** — `<MapboxMini>` with the `parcel_2025_07` vector tileset
  (`res-mbtiles-x.gisjoe.com`), fill colored by `estimated_price_m2` (valoo's
  11-class RdYlGn ramp), a cyan pin at the location. Headline: `CHF X'XXX /m²`.
- **RoofsWidget** — same `<MapboxMini>` + same tileset, fill colored by
  `bldg_height_max` (blue gradient), optional 3D fill-extrusion. Headline:
  `XX.X m`.
- **RootsWidget** — `<LeafletMini>` with the GeoServer WMS tile layer
  `project_res:parcel_2025_07` styled `parcel_by_bldg_constr_yr_with_label`
  over a CartoDB basemap. Headline: `built YYYY`.
- **SoolarWidget** — `<LeafletMini>` with the
  `ch.bfe.solarenergie-eignung-daecher` WMTS overlay over a basemap. Headline:
  total PV yield `XX MWh/yr`.
- **BoomWidget** — `<LeafletMini>` with a BAFU noise WMTS overlay (default
  `ch.bafu.laerm-strassenlaerm_tag`) over a basemap. Headline: `XX dB(A)`.

### Card layout (compact grid)

Each card:

- 16:10 mini-map with a cyan location pin and the app's overlay layer.
- Footer row: app name · headline stat · status badge · external-link icon
  (deep-link into the live app at `?lat&lng`).
- Independent lifecycle — see Loading & errors.

`ReportGrid` lays cards out `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`,
matching showroom's existing dark surface styling.

## Data flow

The headline stat is **decoupled from map rendering**. The map renders the
visual; a separate lib call fetches the number. They run in parallel, so a
slow or failed map never blocks the stat (and vice versa). This is the core
fix for the old fragility.

- **`lib/parcelLookup.ts`** — one GeoServer `GetFeatureInfo` request against
  `project_res:parcel_2025_07` with `INFO_FORMAT=application/json`, returning
  `{ priceM2, heightMax, heightMin, constructionYear, egrid }` for the parcel
  under the pin. A single call feeds the Valoo, Roofs and Roots headline
  stats.
  - **Fallback:** if GeoServer `GetFeatureInfo` as JSON is not enabled for
    that layer, fall back to Mapbox `queryRenderedFeatures` after the map's
    `idle` event (valoo's current method) — done per Mapbox widget. Roots,
    having no Mapbox map, would then read its year from a WMS `GetFeatureInfo`
    directly. This fallback must be verified during implementation
    (see Open verification items).
- **`lib/solarLookup.ts`** — geo.admin `identify` on
  `ch.bfe.solarenergie-eignung-daecher`. Converts WGS84 → Swiss LV95
  (EPSG:2056) for the query, sums `stromertrag` across returned roofs → MWh/yr.
- **`lib/noiseSample.ts`** — fetches the noise WMTS tile under the point at a
  high zoom, reads the pixel color from a canvas, snaps it to the nearest
  dB(A) band.

Each lib module is independently testable: given a `lat`/`lng` it returns a
typed result or a typed "no data" / error outcome.

## Loading & error handling

Every card has an independent lifecycle — no global wait, no polling:

- **Loading** — per-card shimmer skeleton while the map initializes and the
  lookup runs.
- **No data** — amber state when the location yields nothing (address outside
  Switzerland, no parcel/building/roof, noise tile blank). The map may still
  render; only the stat shows "no data".
- **Error** — red state, scoped to the single card, with a retry control that
  re-runs that widget only.

The `?lat&lng&q` URL keeps reports bookmarkable and shareable. The existing
"Regenerate" button simply re-mounts the widgets.

## Configuration

- **Mapbox token** — showroom already declares `VITE_MAPBOX_TOKEN` (currently
  used for the reporter's address geocoding). The Valoo and Roofs widgets use
  this same token. (The valoo/roofs apps themselves hardcode separate tokens;
  showroom does not copy those.)
- All other endpoints (GeoServer WMS, geo.admin `identify`, geo.admin WMTS,
  the `res-mbtiles-x.gisjoe.com` vector tiles) are public and need no auth.

## Removed / out of scope

- **Deleted from showroom:** `src/services/reporterService.ts` (the polling
  service) and `src/components/reporter/ReportCard.tsx` (the screenshot card).
- **Rewritten:** `src/components/reporter/ReporterView.tsx`.
- **Kept unchanged:** `AddressSearch.tsx`, `lib/geocode.ts`,
  `services/signalService.ts` (the address-search signal still fires),
  `Navbar`, the release-notes button.
- **Out of scope:** the `GET /reporter` endpoint in `project_RES` becomes dead
  code once showroom stops calling it. It is left in place; removing it is a
  separate `project_RES` cleanup, flagged but not done here.

## Publishing

Standard SwissNovo publish flow after implementation: verify build +
typecheck, add a `releaseNotes.ts` entry, bump the version, commit, push, open
a PR, merge. Update the toolbox capabilities matrix only if a tracked
capability actually changes (the `/reporter` page already exists, so this is
likely a no-op).

## Open verification items (resolve during implementation)

1. **GeoServer `GetFeatureInfo` JSON** — confirm `INFO_FORMAT=application/json`
   is enabled for `project_res:parcel_2025_07` on
   `gs-contabo-extra.zeroo.ch`. If not, use the Mapbox `queryRenderedFeatures`
   fallback described in Data flow.
2. **Parcel tileset access** — confirm `res-mbtiles-x.gisjoe.com/parcel_2025_07_z12_16`
   serves to showroom's origin without a referer/token restriction.
3. **WMTS / geo.admin CORS** — confirm the geo.admin `identify` endpoint and
   the noise WMTS tiles allow cross-origin reads from showroom's domain
   (the canvas pixel-sampling in `noiseSample.ts` needs CORS-clean tiles).

## Success criteria

- `/reporter?lat&lng&q` for a Swiss address renders 5 cards, each with a real
  mini-map and a correct headline stat, within a few seconds — no 10-minute
  wait, no polling.
- A slow or failing widget degrades only its own card; the others still render.
- No call is made to `https://res.zeroo.ch/reporter`.
- `npm run build` and `npm run typecheck` pass.
