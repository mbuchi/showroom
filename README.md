# Showroom

A modern, dark-mode-first gallery for parcel exports — screenshots, reports,
and rendered outputs from across the Swissnovo toolbox (Roofs, GeoPool, …).

## What it does

- Lists every export saved to the shared image service for the signed-in user
- Groups exports by parcel ID (with address fallback) so related captures
  stay together
- Polished gallery: hover-reveal actions, lightbox preview with metadata
  panel, keyboard navigation
- Filtering, sorting, search, and per-user favorites
- Saved-parcels side panel mirroring the Roofs collection
- **Reporter** (`/reporter`) — type a Swiss address and generate a
  standardized "showroom report": a side-by-side screenshot capture of all 8
  map-first SwissNovo apps (footprint, geopool, groove, valoo, proom, woom,
  scoore, soolar) at that location. Reports are URL-driven, so they are
  bookmarkable and shareable.

## Tech

- Vite + React 18 + TypeScript
- Tailwind CSS (dark mode by default)
- ZITADEL OIDC via `oidc-client-ts` (same auth as Roofs)
- Shared image API at `https://res.zeroo.ch/image/swissnovo`
- Shared parcel API at `https://res.zeroo.ch/res_api/swissnovo_user`
- Reporter screenshot API at `https://res.zeroo.ch/reporter` (project_RES)
- Mapbox geocoding for the reporter's address search

## Setup

```bash
npm install
cp .env.example .env  # fill in VITE_ZITADEL_* values
npm run dev
```

Required env vars:

```
VITE_ZITADEL_AUTHORITY=https://your-instance.zitadel.cloud
VITE_ZITADEL_CLIENT_ID=your_client_id
```

Optional env var (enables the reporter's address search):

```
VITE_MAPBOX_TOKEN=pk.your_mapbox_public_token
```

The ZITADEL app must list `https://<your-domain>/` as an allowed redirect URI.

> The `/reporter` page also depends on the `GET /reporter` endpoint in
> `project_RES`, which screenshots the 8 map-first apps through an
> authenticated headless browser. That backend needs a dedicated Zitadel
> "reporter" service account configured via `REPORTER_ZITADEL_USER` /
> `REPORTER_ZITADEL_PASS` on the RES host.

## Keyboard shortcuts

| Key            | Action                       |
| -------------- | ---------------------------- |
| `/` or `⌘K`    | Focus search                 |
| `←` / `→`      | Navigate exports in lightbox |
| `J` / `K`      | Same as arrow navigation     |
| `F`            | Toggle favorite              |
| `I`            | Toggle metadata panel        |
| `Esc`          | Close panel / clear search   |

## Architecture

```
src/
├── auth/            ZITADEL OIDC config + React context
├── services/        Image + parcel HTTP clients
├── lib/             Pure helpers: formatting, grouping, favorites
├── hooks/           Reusable browser hooks
├── components/
│   ├── Navbar.tsx
│   ├── UserMenu.tsx
│   ├── SignInGate.tsx
│   ├── gallery/     Main gallery view, toolbar, cards, parcel groups
│   ├── lightbox/    Fullscreen preview + metadata panel
│   ├── reporter/    Address search + consolidated showroom report
│   └── parcels/     Read-only saved-parcels side panel
└── App.tsx          Auth gate → gallery / reporter route
```

Built to mirror the Roofs design system so users moving between apps feel at
home.
