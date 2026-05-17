import {
  Sparkles, Palette, Shield, Bug, Zap, Type, Image as ImageIcon,
  LayoutGrid, KeyRound, Eraser, Eye, FileBarChart, MapPin, Camera, Package, Layers,
} from 'lucide-react';
import type { ChangeKind, ChangeItem, Release } from '@swissnovo/shared';

export type { ChangeKind, ChangeItem, Release };
export { KIND_META } from '@swissnovo/shared';

// Newest first. Versioning follows SemVer. Showroom is pre-1.0 while
// the gallery, auth gate, and lightbox experience are stabilising.
export const RELEASES: Release[] = [
  {
    version: '0.6.1',
    date: 'May 18, 2026',
    codename: 'Maps Unboxed',
    summary:
      'Fixes the Valoo and Roofs report cards rendering as dark, empty boxes. Their Mapbox maps were collapsing to zero height — Mapbox adds a class that forces position:relative onto its container, which cancelled the Tailwind absolute inset-0 that was sizing it. The map container is now wrapped so its sizing no longer depends on position.',
    items: [
      {
        kind: 'fixed',
        icon: Bug,
        text: 'Valoo and Roofs cards showed a dark box instead of a map (the data and headline stat were correct — only the canvas was blank). The Mapbox container carried both Tailwind\'s `absolute inset-0` and Mapbox\'s own `.mapboxgl-map` class; the latter\'s `position: relative` won the cascade, so `inset-0` no longer sized the element and it collapsed to height 0. MapboxMini now uses an outer positioned wrapper plus an inner `h-full w-full` container, so the map is sized independently of `position`.',
        prs: [],
      },
    ],
  },
  {
    version: '0.6.0',
    date: 'May 18, 2026',
    codename: 'Live Reporter',
    summary:
      'The Reporter is rebuilt. Instead of waiting on a headless browser to screenshot eight apps — slow, and the images often did not work well — /reporter now renders five live, in-browser map widgets recreating the signature view of each app: Valoo valuation, Roofs building height, Roots construction year, Soolar solar potential and Boom noise exposure. Each card loads on its own, so a report appears in seconds with no multi-minute wait.',
    highlight: true,
    items: [
      {
        kind: 'new',
        icon: FileBarChart,
        text: 'The report is now a grid of five live widget cards — Valoo (CHF/m² parcel valuation), Roofs (3D building height), Roots (construction-year map), Soolar (rooftop PV potential) and Boom (road-noise exposure) — each a real mini-map at the searched address, drawn from the same data the apps themselves use.',
        prs: [],
      },
      {
        kind: 'improved',
        icon: Zap,
        text: 'No more headless-browser screenshots and no more polling a background job for up to ten minutes. Each card fetches its own data and renders independently, so a slow or unavailable source degrades just that one card while the rest of the report still appears within seconds.',
        prs: [],
      },
      {
        kind: 'improved',
        icon: Layers,
        text: 'The reporter route is now lazy-loaded — the map libraries (mapbox-gl, leaflet) only download when you open /reporter, keeping the gallery page lean.',
        prs: [],
      },
    ],
  },
  {
    version: '0.5.7',
    date: 'May 17, 2026',
    codename: 'Stable Login',
    summary:
      'Signing in no longer crashes the app — fixed a Rules of Hooks violation in the user menu.',
    items: [
      {
        kind: 'fixed',
        icon: Shield,
        text: 'Signing in crashed the app with a blank screen (React error #310). The user menu called the useAvatar() hook after its early returns for the loading and signed-out states, so logging in rendered more hooks than the previous render. The hook is now called unconditionally at the top of the component.',
        prs: [],
      },
    ],
  },
  {
    version: '0.5.6',
    date: 'May 16, 2026',
    codename: 'Signal',
    summary:
      'Address searches on the Reporter page now emit a lightweight telemetry signal to the shared RES API — the same suite-wide signal every other SwissNovo app sends on address selection.',
    items: [
      {
        kind: 'improved',
        icon: MapPin,
        text: 'Selecting an address on /reporter now POSTs an address-search signal to res.zeroo.ch via a new /api/signal-collect Vercel edge-function proxy. Fire-and-forget — signal errors never interrupt the search flow.',
        prs: [],
      },
    ],
  },
  {
    version: '0.5.5',
    date: 'May 16, 2026',
    codename: 'Shared Auth',
    summary:
      'Sign-in is now powered by the shared @swissnovo/shared package — the OIDC auth layer is de-duplicated across the SwissNovo suite. The sign-in experience is unchanged.',
    items: [
      {
        kind: 'improved',
        icon: Package,
        text: 'OIDC authentication (sign-in, sign-up, single sign-on, token refresh) now comes from the shared @swissnovo/shared package instead of a per-app copy. The UX is identical, but auth fixes and improvements now roll out suite-wide from one source.',
        prs: [],
      },
    ],
  },
  {
    version: '0.5.4',
    date: 'May 16, 2026',
    codename: 'Patient Reporter',
    summary:
      'The reporter no longer fails on slow runs. Capturing 8 apps can take several minutes, and the old single long request was killed by a gateway timeout — which the browser reported as a confusing CORS error. The reporter now polls a background job, so a cold capture finishes reliably however long it takes.',
    items: [
      {
        kind: 'fixed',
        icon: Bug,
        text: 'Generating a report no longer fails partway through with a gateway-timeout / CORS-style error. The backend captures in the background and Showroom polls for the result, so long cold runs complete cleanly.',
        prs: [],
      },
    ],
  },
  {
    version: '0.5.3',
    date: 'May 15, 2026',
    codename: 'Top of the Stack',
    summary:
      'Reliability fix for the in-app release-notes panel: it now always opens above the navigation bar instead of being clipped behind it, and is easier to dismiss.',
    items: [
      {
        kind: 'fixed',
        icon: Layers,
        text: "The release-notes panel now always renders above the app's navigation bar and other chrome — on apps with a high z-index header it was previously clipped behind the navbar. Press Esc or click outside the panel to dismiss it; the version pill also toggles it shut.",
        prs: [],
      },
    ],
  },
  {
    version: '0.5.2',
    date: 'May 15, 2026',
    codename: 'Shareable Links',
    summary:
      'Bookmarked and shared report links now work on Vercel. Showroom is a single-page app, so opening a deep link like /reporter?lat=…&lng=… directly (or refreshing the page) previously hit a 404 because the host had no SPA fallback. A vercel.json rewrite now routes every in-app path back to the app, making reports genuinely bookmarkable and shareable as advertised.',
    items: [
      {
        kind: 'fixed',
        icon: Bug,
        text: 'Direct visits and refreshes on /reporter (and any shared /reporter?lat=…&lng=… link) no longer 404 on Vercel — added a vercel.json SPA rewrite to /index.html.',
        prs: [],
      },
      {
        kind: 'docs',
        icon: Type,
        text: 'Added .env.example documenting the required VITE_ZITADEL_* variables and the VITE_MAPBOX_TOKEN that powers the reporter address search.',
        prs: [],
      },
    ],
  },
  {
    version: '0.5.1',
    date: 'May 15, 2026',
    codename: 'Shared Foundations',
    summary:
      'The release-notes panel is now provided by the shared @swissnovo/shared package instead of a copy-pasted component — the first step in de-duplicating common code across the SwissNovo suite.',
    items: [
      {
        kind: 'improved',
        icon: Package,
        text: 'ReleaseNotesButton and ReleaseNotesPanel now come from the shared @swissnovo/shared package. The UI is unchanged, but changelog bug fixes and improvements now roll out suite-wide from one source instead of being hand-applied per app.',
        prs: [],
      },
    ],
  },
  {
    version: '0.5.0',
    date: 'May 15, 2026',
    codename: 'Reporter',
    summary:
      'New /reporter page. Type a Swiss address and Showroom resolves it via Mapbox geocoding, then generates a standardized "showroom report" — a side-by-side capture of all 8 map-first SwissNovo apps (footprint, geopool, groove, valoo, proom, woom, scoore, soolar) at that exact location, ready for comparison. Reports are driven entirely from the URL, so any report is bookmarkable and shareable.',
    highlight: true,
    items: [
      {
        kind: 'new',
        icon: FileBarChart,
        text: 'New /reporter route — a consolidated comparison grid of all 8 map-first apps captured at one address. Each card carries a status badge and a deep-link into the live app at the resolved ?lat/?lng.',
        prs: [],
      },
      {
        kind: 'new',
        icon: MapPin,
        text: 'Mapbox-geocoded address search (src/lib/geocode.ts) with debounced autocomplete, keyboard navigation, and a clear banner when VITE_MAPBOX_TOKEN is not configured.',
        prs: [],
      },
      {
        kind: 'new',
        icon: Camera,
        text: 'Captures come from a new RES backend endpoint (GET res.zeroo.ch/reporter) that screenshots each app through an authenticated headless browser. Results are cached server-side, so a shared report URL reloads instantly.',
        prs: [],
      },
      {
        kind: 'improved',
        icon: LayoutGrid,
        text: 'Navbar now carries a Gallery / Reporter nav, and in-app navigation is a SPA transition (pushState) instead of a full reload — the auth boot no longer re-runs when switching pages.',
        prs: [],
      },
    ],
  },
  {
    version: '0.4.4',
    date: 'May 15, 2026',
    codename: 'Avatar Live',
    summary:
      'Picking a new avatar updates the header (and any other avatar in the UI) immediately — no page refresh needed. useAvatar() now shares its state across every consumer.',
    items: [
      {
        kind: 'fixed',
        icon: ImageIcon,
        text: 'src/lib/useAvatar.ts moved from per-hook useState to a module-level subscriber set so AvatarPicker → UserMenu propagates in the same tick.',
        prs: [],
      },
    ],
  },
  {
    version: '0.4.3',
    date: 'May 15, 2026',
    codename: 'Avatar Anchored',
    summary:
      'Avatar customisation now persists to the shared RES API user profile instead of the failing Zitadel metadata endpoint, so a picked icon survives sign-out and shows up across every SwissNovo app.',
    items: [
      {
        kind: 'fixed',
        icon: ImageIcon,
        text: 'src/lib/avatarStorage.ts now PUTs avatar_icon to https://res.zeroo.ch/res_api/swissnovo_user/profile (users_zitadel.avatar_icon); localStorage fallback retained.',
        prs: [],
      },
    ],
  },
  {
    version: '0.4.2',
    date: 'May 15, 2026',
    codename: 'Button Lifted',
    summary:
      'Release-notes pill is now a self-contained ReleaseNotesButton component. GalleryView.tsx no longer carries the open/unread state, storage handlers, or inlined pill JSX — matches the roots template so the suite stays consistent.',
    items: [
      {
        kind: 'improved',
        icon: LayoutGrid,
        text: 'src/components/ReleaseNotesButton.tsx now owns the pill state, localStorage key, hash deep-link, and panel mount. ~70 lines of duplicated wiring removed from GalleryView.',
        prs: [],
      },
    ],
  },
  {
    version: '0.4.1',
    date: 'May 14, 2026',
    codename: 'Stacking Order',
    summary:
      'Preventative fix to the navbar stacking context so the user menu dropdown always renders above side panels like Saved Parcels.',
    items: [
      {
        kind: 'fixed',
        icon: Bug,
        text: 'Navbar z-index raised so the user menu dropdown is no longer trapped below same-level side panels.',
        prs: [],
      },
    ],
  },
  {
    version: '0.4.0',
    date: 'May 13, 2026',
    codename: 'Fast Boot',
    summary:
      'A focused performance pass on the auth boot path. The cold-start spinner no longer holds the UI hostage waiting on a silent SSO probe — visitors see the sign-in gate (or the gallery, if their session is still valid) within a second or two of the bundle landing.',
    highlight: true,
    items: [
      {
        kind: 'fixed',
        icon: Zap,
        text: 'Unblocked initial paint from the silent SSO timeout — `signinSilent()` now runs in the background and the existing `userLoaded` listener upgrades the UI when it succeeds. Silent request timeout trimmed from 10s to 4s.',
        prs: [6],
      },
    ],
  },
  {
    version: '0.3.0',
    date: 'May 9, 2026',
    codename: 'Brand Polish',
    summary:
      'A round of visual cleanup around the showroom wordmark. Varela Round arrives, the gradient logo square is gone, sizing is unified across all three letterforms, and parcel-group headers now lead with the parcel ID instead of the address.',
    items: [
      {
        kind: 'improved',
        icon: Type,
        text: 'Showroom wordmark restyled per the Roolez-derived branding spec — Varela Round, lowercase, with the middle `oo` rendered in red while the rest follows the surface color.',
        prs: [3],
      },
      {
        kind: 'improved',
        icon: Palette,
        text: 'Swapped parcel ID and address text colors in the group header so the unique identifier is the visually dominant element.',
        prs: [4],
      },
      {
        kind: 'improved',
        icon: ImageIcon,
        text: 'Removed the blue gradient logo square and unified wordmark sizing — `showr`, `oo`, and `m` now render at exactly the same visual size.',
        prs: [5],
      },
    ],
  },
  {
    version: '0.2.0',
    date: 'May 9, 2026',
    codename: 'Sign-In Resilience',
    summary:
      'Authentication failures are no longer silent. A missing `VITE_ZITADEL_*` env var now surfaces a clear in-app banner pointing at the exact Vercel setting to fix, and any redirect-time error is rendered inline instead of becoming an unhandled promise rejection.',
    items: [
      {
        kind: 'fixed',
        icon: Shield,
        text: 'Auth-config errors now surface in the UI — missing env vars trigger a yellow banner naming what is missing, and `login()` / `register()` failures render inline in red with a per-button spinner.',
        prs: [2],
      },
      {
        kind: 'improved',
        icon: KeyRound,
        text: '`authConfig.ts` exposes `isAuthConfigured` and `missingAuthEnvVars`, and builds `userManager` with safe placeholders so a misconfigured deploy still imports cleanly.',
        prs: [2],
      },
    ],
  },
  {
    version: '0.1.0',
    date: 'May 9, 2026',
    codename: 'Foundations',
    summary:
      'The first usable build. A dark-mode-first gallery for every export the signed-in user has saved across the Swissnovo toolbox — ZITADEL OIDC auth, smart parcel grouping, lightbox with metadata, per-user favorites, and keyboard-first navigation.',
    items: [
      {
        kind: 'new',
        icon: Sparkles,
        text: 'Vite + React + TS + Tailwind app shell with a Linear/Vercel/Raycast-inspired dark surface system — glass nav, raised surfaces, fade/scale/slide animations.',
        prs: [1],
      },
      {
        kind: 'new',
        icon: Shield,
        text: 'ZITADEL OIDC auth via `oidc-client-ts` — same `authConfig.ts` shape as Roofs, with silent SSO + redirect flow and a full-screen `SignInGate` for unauthenticated visitors.',
        prs: [1],
      },
      {
        kind: 'new',
        icon: LayoutGrid,
        text: 'Smart parcel grouping — exports cluster by `prm_id` (with `custom_metadata.central_parcel_id` fallback). Each group shows address, parcel ID, app badges, last activity, total size, and a 4-up preview.',
        prs: [1],
      },
      {
        kind: 'new',
        icon: Eye,
        text: 'Fullscreen lightbox with side metadata panel, prev/next navigation, download, favorite, and delete actions.',
        prs: [1],
      },
      {
        kind: 'new',
        icon: Eraser,
        text: 'Toolbar with view-mode toggle (Grouped / Flat), sort modes, app-source filter chips, favorites toggle, and refresh. Three empty states plus an error state.',
        prs: [1],
      },
      {
        kind: 'new',
        icon: KeyRound,
        text: 'Per-user favorites in `localStorage`, keyed by ZITADEL `sub`. Keyboard shortcuts: `/` or `⌘K` focus search, `←`/`→`/`J`/`K` navigate lightbox, `F` favorite, `I` toggle metadata, `Esc` close.',
        prs: [1],
      },
      {
        kind: 'new',
        icon: Bug,
        text: 'Saved-parcels side panel reading from `res_api/swissnovo_user/parcels`, rendered with the same StateBadge / PriorityBadge / TagBadge pattern as Roofs.',
        prs: [1],
      },
    ],
  },
];

export const CURRENT_VERSION = RELEASES[0].version;
export const REPO_URL = 'https://github.com/mbuchi/showroom';
