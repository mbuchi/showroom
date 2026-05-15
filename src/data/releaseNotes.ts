import type { LucideIcon } from 'lucide-react';
import {
  Sparkles, Palette, Shield, Bug, Zap, Type, Image as ImageIcon,
  LayoutGrid, KeyRound, Eraser, Eye,
} from 'lucide-react';

export type ChangeKind = 'new' | 'improved' | 'fixed' | 'docs';

export interface ChangeItem {
  kind: ChangeKind;
  icon: LucideIcon;
  text: string;
  prs: number[];
}

export interface Release {
  version: string;
  date: string;
  codename: string;
  summary: string;
  highlight?: boolean;
  items: ChangeItem[];
}

export const KIND_META: Record<ChangeKind, { label: string; classes: string; dot: string }> = {
  new: {
    label: 'New',
    classes: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    dot: 'bg-cyan-500',
  },
  improved: {
    label: 'Improved',
    classes: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    dot: 'bg-amber-500',
  },
  fixed: {
    label: 'Fixed',
    classes: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  docs: {
    label: 'Docs',
    classes: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    dot: 'bg-sky-500',
  },
};

// Newest first. Versioning follows SemVer. Showroom is pre-1.0 while
// the gallery, auth gate, and lightbox experience are stabilising.
export const RELEASES: Release[] = [
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
