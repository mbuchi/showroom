import {
  ShieldAlert,
  Sparkles, Palette, Shield, Bug, Zap, Type, Image as ImageIcon,
  LayoutGrid, KeyRound, Eraser, Eye, FileBarChart, MapPin, Camera, Package, Layers, CircleUser, Globe, Bookmark, BadgeCheck, Code2, Smartphone, ExternalLink,
} from 'lucide-react';
import type { ChangeKind, ChangeItem, Release } from '@aireon/shared';

export type { ChangeKind, ChangeItem, Release };
export { KIND_META } from '@aireon/shared';

// Newest first. Versioning follows SemVer. Showroom is pre-1.0 while
// the gallery, auth gate, and lightbox experience are stabilising.
export const RELEASES: Release[] = [
  {
    version: '0.12.33',
    date: 'June 16, 2026',
    codename: 'Mission Control',
    summary:
      'A redesigned, on-brand sign-in screen with the Aireon look.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: Sparkles,
        text:
          'The sign-in screen has a fresh Aireon look — the Aireon wordmark on a dark “mission-control” card with a subtle map-grid texture and a soft red glow, replacing the old white SWISSNOVO card. It now matches the rest of the Aireon suite.',
        prs: [],
      },
    ],
  },

  {
    version: '0.12.32',
    date: 'June 16, 2026',
    codename: 'Untrack Toggle',
    summary:
      'The “Track parcel” button can now untrack a parcel you previously saved.',
    items: [
      {
        kind: 'fixed' as ChangeKind,
        icon: Bookmark,
        text:
          'The “Track parcel” bookmark on the parcel strip is now a toggle: once a parcel is tracked you can click the button again to untrack it and remove it from your saved parcels. Previously the button stayed disabled after saving, so there was no way to undo a track.',
        prs: [],
      },
    ],
  },

  {
    version: '0.12.31',
    date: 'June 16, 2026',
    codename: 'History Up Top',
    summary:
      'Your search history now sits at the top of the account menu’s “More tools”.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: CircleUser,
        text:
          '“My search history” now lives in the account menu’s “More tools” section, right after “Take the tour” — it used to sit lower down, near “Sign out”. The reordering comes from the suite-shared MapUserMenu (@aireon/shared v1.26.0).',
        prs: [],
      },
    ],
  },

  {
    version: '0.12.30',
    date: 'June 16, 2026',
    codename: 'Report From The Menu',
    summary:
      'Reporting a problem now lives in the account menu instead of a floating button.',
    items: [
      {
        kind: 'changed' as ChangeKind,
        icon: Bug,
        text:
          'The “Report a problem” control moved out of the floating shield button and into the account menu’s “More tools” group, right under “Take the tour”. The bug-report dialog itself is unchanged — it is now opened from the menu and owned by the suite-shared MapUserMenu (@aireon/shared v1.25.0).',
        prs: [],
      },
    ],
  },

  {
    version: '0.12.29',
    date: 'June 14, 2026',
    codename: 'Dark Rails',
    summary:
      'Dark mode now uses a slim, refined scrollbar shared across the Aireon suite.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: Sparkles,
        text:
          'In dark theme the scrollbars are now a slim, rounded slate “pill” that lightens on hover, instead of the heavy default bar. The design lives in @aireon/shared, so dark-mode scrollbars look identical across every Aireon app.',
        prs: [],
      },
    ],
  },

  {
    version: '0.12.28',
    date: 'June 14, 2026',
    codename: 'Two By Two',
    summary:
      'The saved-parcels pipeline counts in the account menu now sit in a balanced 2×2 grid.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: Layers,
        text:
          'In the “My saved parcels” summary, the four pipeline stages (New, Contacted, Negotiating, Due Diligence) now lay out as a tidy 2×2 grid instead of an uneven 3 + 1.',
        prs: [],
      },
    ],
  },

  {
    version: '0.12.27',
    date: 'June 13, 2026',
    codename: 'One Saved-Parcels Door',
    summary:
      'The account menu now has a single "My saved parcels" entry instead of two parcel bookmarks.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: Eraser,
        text:
          'Removed the duplicate "Saved parcels" entry from the account menu. There were two bookmark items — a legacy read-only drawer that loaded a deprecated parcel list, and the canonical "My saved parcels" view backed by your real saved parcels (the same records the reporter saves). The legacy drawer and its dead data path have been deleted, leaving one clear "My saved parcels" action.',
        prs: [],
      },
    ],
  },

  {
    version: '0.12.26',
    date: 'June 13, 2026',
    codename: 'Shared Shell',
    summary:
      'The top bar now renders through the suite-shared navbar shell, matching the rest of the suite.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: LayoutGrid,
        text:
          'Rebuilt the top bar on the suite-shared AppNavbar shell (from @aireon/shared v1.18.2) so the hub badge, showroom wordmark, and account menu match valoo, taxoo, and the rest of the suite. The gallery search, Gallery / Reporter navigation, language picker, and saved-parcels menu are unchanged — this is a structural alignment, not a redesign.',
        prs: [],
      },
    ],
  },

  {
    version: '0.12.25',
    date: 'June 13, 2026',
    codename: 'Map Credit',
    summary:
      'The reporter mini-maps now show their required basemap attribution again.',
    items: [
      {
        kind: 'fixed' as ChangeKind,
        icon: MapPin,
        text:
          'Restored the basemap attribution on the reporter widget mini-maps. The MapLibre swap had turned the attribution control off, so the required Mapbox-styles credit was silently missing; it now renders compactly in the corner.',
        prs: [],
      },
    ],
  },

  {
    version: '0.12.24',
    date: 'June 13, 2026',
    codename: 'Steady Dialogs',
    summary:
      'The report and export-preview dialogs now render through a page-body portal so they always center reliably.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: LayoutGrid,
        text:
          'Hardened the report dialog and the export lightbox to render via a portal to the page body. This keeps them reliably centered regardless of surrounding layout — matching how the rest of the suite mounts its overlays and pre-empting the containing-block pitfall that can push a fixed overlay under the header.',
        prs: [],
      },
    ],
  },

  {
    version: '0.12.23',
    date: 'June 12, 2026',
    codename: 'Report Categories',
    summary:
      'The bug report form now lets users classify bugs and feedback before sending.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: ShieldAlert,
        text:
          'Updated @aireon/shared to v1.16.0 so the Bug/Feedback dialog now includes optional category checkboxes. Error reports can be marked as data, UI, map/address, login/access or crash/performance issues; feedback can be marked as feature request, data improvement, usability, design/content or general feedback. Selected categories are sent with the report metadata.',
        prs: [],
      },
    ],
  },

  {
    version: '0.12.22',
    date: 'June 12, 2026',
    codename: 'Open in proom',
    summary:
      'The saved parcels panel now has a one-tap shortcut to open your portfolio in proom.',
    items: [
      {
        kind: 'new' as ChangeKind,
        icon: ExternalLink,
        text:
          'Added an "Open in proom" action beside "Manage in Roofs" in the saved parcels panel, so you can jump straight to the proom portfolio in a new tab.',
        prs: [],
      },
      {
        kind: 'improved' as ChangeKind,
        icon: Sparkles,
        text:
          'Updated @aireon/shared to v1.16.0, which adds an inline edit button to the account card status line.',
        prs: [],
      },
    ],
  },

  {
    version: '0.12.21',
    date: 'June 12, 2026',
    codename: 'Theme-Aware Hub Mark',
    summary:
      'The top-left Aireon hub shortcut now renders as a transparent monochrome mark that follows light and dark themes.',
    items: [
      {
        kind: 'improved',
        icon: Sparkles,
        text:
          'Updated the top-left Aireon hub shortcut to use the hub-hosted transparent Aireon mark. It renders black on light themes and white on dark themes, while the browser favicon stays red on white.',
        prs: [],
      },
    ],
  },


  {
    version: '0.12.20',
    date: 'June 11, 2026',
    codename: 'Shared Account Menu',
    summary:
      'The account menu now uses the shared Aireon user menu, including the immediate avatar picker update from @aireon/shared.',
    items: [
      {
        kind: 'improved',
        icon: Sparkles,
        text:
          'Standardized the navbar hub shortcut on @aireon/shared v1.14.11 so the top-left button uses the canonical Aireon favicon from hub.aireon.ch.',
        prs: [],
      },
      {
        kind: 'improved' as ChangeKind,
        icon: ShieldAlert,
        text:
          'Updated @aireon/shared to v1.14.9 so the bug-report launcher, dialog header and Bug type selector now use the Lucide shield-alert icon across the shared widget.',
        prs: [],
      },
      {
        kind: 'new' as ChangeKind,
        icon: Bug,
        text:
          'Added the shared Aireon bug-report button. It opens a compact Bug/Feedback modal and sends reports through the central Bug Tracker.',
        prs: [],
      },
    {
      kind: 'fixed' as ChangeKind,
      icon: Bug,
      text:
        'Fixed the bug-report deployment lockfile so the live app uses the current shared errorlog collector.',
      prs: [],
    },
      {
        kind: 'improved' as ChangeKind,
        icon: CircleUser,
        text:
          'Replaced showroom’s custom account dropdown with the suite-canonical MapUserMenu from @aireon/shared. Release notes, saved parcels, gallery count, profile, sign in and sign out remain available, while avatar selection now follows the same three-row picker and instant update behavior as the rest of Aireon.',
        prs: [],
      },
    ],
  },

  {
    version: '0.12.19',
    date: 'June 10, 2026',
    codename: 'Mobile Reach',
    summary:
      'The Gallery and Reporter nav links are now reachable on phones via a ⋯ "More tools" menu — previously they vanished below the small-screen breakpoint, stranding the Reporter page on mobile. Desktop is unchanged.',
    items: [
      {
        kind: 'fixed' as ChangeKind,
        icon: Smartphone,
        text:
          'On phones the top navigation links (Gallery / Reporter) were hidden with no fallback, making the Reporter page unreachable on mobile. They now collapse into a single ⋯ "More tools" menu so every page stays navigable. The desktop navbar is byte-identical.',
        prs: [],
      },
    ],
  },

  {
    version: '0.12.18',
    date: 'June 10, 2026',
    codename: 'Aireon Wordmark',
    summary:
      'Rebrand fixes: the exported PDF, the sign-in gate and all in-app copy now read Aireon, and outbound links point at the canonical aireon.ch domains.',
    items: [
      {
        kind: 'fixed' as ChangeKind,
        icon: FileBarChart,
        text:
          'The exported PDF report no longer carries the retired, misspelled "SWISSNOOVO" wordmark — the cover and per-page footer now read the correct "aireon" brand, and the document metadata (author/creator/producer) is rebranded too.',
        prs: [],
      },
      {
        kind: 'fixed' as ChangeKind,
        icon: KeyRound,
        text:
          'The signed-out login gate now welcomes you to the Aireon suite with an Aireon account, replacing the pre-rebrand "Swissnovo toolbox" copy.',
        prs: [],
      },
      {
        kind: 'fixed' as ChangeKind,
        icon: Globe,
        text:
          'Swept every remaining "SwissNovo" string in the gallery, reporter and report copy (EN/FR/DE/IT) to Aireon, and repointed the reporter deep links, PDF source URLs and "Open Roofs" CTAs at the canonical *.aireon.ch domains.',
        prs: [],
      },
      {
        kind: 'fixed' as ChangeKind,
        icon: MapPin,
        text:
          'The Roofs mini-map card now uses the Dark basemap instead of the light Streets style, matching showroom’s dark-only theme and the rest of the report cards.',
        prs: [],
      },
    ],
  },
{
    version: '0.12.17',
    date: 'June 9, 2026',
    codename: 'Aligned Meta',
    summary:
      'The page metadata now uses the same description shown on the Aireon hub card.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: Sparkles,
        text:
          'Updated the HTML meta, Open Graph and Twitter descriptions to match the Aireon hub card copy: "Assemble a property report from all aireon services instantly".',
        prs: [],
      },
    ],
  },
{
    version: '0.12.16',
    date: 'June 9, 2026',
    codename: 'Open Renderer',
    summary:
      'The reporter mini-maps now run on the open-source MapLibre GL engine — same basemaps, same look, same features.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: Layers,
        text:
          'Switched the map engine that powers the reporter\'s Valoo and Roofs mini-maps from Mapbox GL to the open-source MapLibre GL. The basemaps (the same Mapbox-hosted Dark / Light / Streets styles), the look, and every feature are unchanged — this is an internal renderer swap that keeps showroom on a fully open-source map stack.',
        prs: [],
      },
    ],
  },
  {
    version: '0.12.15',
    date: 'June 9, 2026',
    codename: 'Bigger Wordmark',
    summary:
      'The showroom wordmark in the top bar is now larger, matching the suite-standard brand size across every Aireon app.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: Type,
        text:
          'The "showroom" brand wordmark in the top bar is now rendered at the suite-standard size (text-4xl / 36px), matching xploore and the rest of the Aireon apps. Purely a size change — the colours, weight, and the red "oo" accent are unchanged.',
        prs: [],
      },
    ],
  },
  {
    version: '0.12.14',
    date: 'June 9, 2026',
    codename: 'Back to Hub',
    summary:
      'An Aireon logo now sits at the left of the top bar — one tap takes you back to the Aireon hub.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: Globe,
        text:
          'The Aireon wordmark now appears as a small "back-to-hub" badge on the far left of the top bar, just before the showroom logo. Tap it for a one-tap route to the Aireon hub (hub.aireon.ch). It sits muted next to the showroom brand and brightens on hover — matching the suite-wide navbar for consistency across every Aireon app.',
        prs: [],
      },
    ],
  },
  {
    version: '0.12.13',
    date: 'June 8, 2026',
    codename: 'Tidy Toolbar',
    summary:
      'A slimmer top bar: release notes now live under "More tools" in your account menu instead of as a separate pill.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: LayoutGrid,
        text:
          'The top bar is decluttered. The "What\'s new" / release-notes pill has moved out of the bar and into a new "More tools" section inside your account menu, with a red dot when there are unseen notes. Same release notes, fewer buttons up top — matching the suite-wide variant 2 ("User Dropdown") navbar.',
        prs: [],
      },
    ],
  },
  {
    version: '0.12.12',
    date: 'June 5, 2026',
    codename: 'One Sign-In',
    summary:
      'Cross-app single sign-on: if you are already signed in to another Aireon app in this browser, showroom signs you in automatically on load.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: KeyRound,
        text:
          "Cross-app single sign-on now works: if you're signed in to any Aireon app in this browser, showroom signs you in automatically on load — a brief, UI-less check, no second password. Anonymous visitors are unaffected.",
        prs: [],
      },
    ],
  },
  {
    version: '0.12.11',
    date: 'June 4, 2026',
    codename: 'Track Parcel',
    summary:
      'The parcel save action is now labelled "Track parcel" — plain wording that replaces the old "Save to PRM" jargon.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: Type,
        text:
          'The Reporter parcel strip\'s save button now reads "Track parcel" (and "Tracked" once saved) instead of "Save to PRM" / "Saved to PRM". Relabelled in all four languages — EN "Track parcel" / "Tracked", FR "Suivre la parcelle" / "Suivie", DE "Parzelle verfolgen" / "Verfolgt", IT "Segui la particella" / "Seguita". No change to where parcels are saved.',
        prs: [],
      },
    ],
  },
  {
    version: '0.12.10',
    date: 'June 4, 2026',
    codename: 'Instant Recall',
    summary:
      'Repeat lookups are now instant — parcel, construction-year, solar, and address-search results are cached locally in your browser.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: Zap,
        text:
          'Reporter lookups now read through a local browser cache (IndexedDB), so revisiting a location you have already searched returns its parcel facts, construction year, solar potential, and address matches with zero network latency. The cache sits in front of the backend (which has its own Redis layer) and silently falls back to a normal network fetch if the browser store is unavailable.',
        prs: [],
      },
    ],
  },
  {
    version: '0.12.9',
    date: 'June 4, 2026',
    codename: 'Compiler On',
    summary:
      'The React Compiler 1.0 now optimises the build with automatic compile-time memoization — fewer needless re-renders, no behaviour change.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: Zap,
        text:
          'Enabled the React Compiler 1.0 (Babel plugin, target React 18) for automatic compile-time memoization — fewer needless re-renders, no behaviour change. Healthcheck: 46/46 components compiled.',
        prs: [],
      },
    ],
  },
  {
    version: '0.12.8',
    date: 'June 2, 2026',
    codename: 'Suite Standard',
    summary:
      'Typography design tokens reverted to the suite-standard --hood-* namespace so fonts stay consistent across every SwissNovo app.',
    items: [
      {
        kind: 'fixed' as ChangeKind,
        icon: Type,
        text:
          'The CSS custom properties for the suite typography system are renamed back to the shared --hood-font / --hood-display / --hood-mono namespace, reverting an app-local fork. The brand wordmark’s red “oo” now uses text-red-500 / dark:text-red-400 to match the rest of the suite. No visual change to the font stacks — still Inter / Varela Round / JetBrains Mono.',
        prs: [],
      },
    ],
  },
  {
    version: '0.12.7',
    date: 'June 2, 2026',
    codename: 'Theme Match',
    summary:
      'The Valoo valuation map in the reporter now follows the app theme instead of always rendering in light mode.',
    items: [
      {
        kind: 'fixed' as ChangeKind,
        icon: Palette,
        text:
          'The Valoo widget’s Mapbox choropleth basemap now branches between the light and dark Mapbox styles based on the active theme, so it no longer renders a bright light-mode map inside the dark reporter. It reacts live if the theme changes.',
        prs: [],
      },
    ],
  },
  {
    version: '0.12.6',
    date: 'June 2, 2026',
    codename: 'Edge Cached',
    summary:
      'Parcel lookups are now cached at the edge for an hour, so repeat reporter loads are faster and lean less on the upstream API.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: Zap,
        text:
          'The parcel-data proxy now sets edge cache headers (s-maxage=3600, stale-while-revalidate=86400) on successful lookups. Since Swiss parcel details are highly static, Vercel’s edge network can serve repeat requests without round-tripping to the RES API — reducing latency and upstream quota. Error responses are never cached.',
        prs: [],
      },
    ],
  },
  {
    version: '0.12.5',
    date: 'June 2, 2026',
    codename: 'Own Namespace',
    summary:
      'Typography design tokens were briefly re-namespaced to an app-local prefix (later reverted to the suite standard in 0.12.8).',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: Type,
        text:
          'The suite typography CSS custom properties were temporarily renamed to an app-local namespace. This drifted from the shared suite standard and was reverted in 0.12.8. No visual change — same Inter / Varela Round / JetBrains Mono stacks.',
        prs: [],
      },
    ],
  },
  {
    version: '0.12.4',
    date: 'May 31, 2026',
    codename: 'Shared Preview',
    summary:
      'Social-share preview image now points at the centralized toolbox meta URL.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: ImageIcon,
        text:
          'Social-share preview image now uses the centralized toolbox URL (https://toolbox.swissnovo.com/meta/showroom.jpg) with correct dimensions.',
        prs: [],
      },
    ],
  },
  {
    version: '0.12.3',
    date: 'May 31, 2026',
    codename: 'Vercel Only',
    summary:
      'Removed dead Netlify config — Vercel-only.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: Eraser,
        text:
          'Removed dead Netlify config — Vercel-only. Showroom deploys exclusively on Vercel (vercel.json + /api edge functions), so the stale netlify.toml has been deleted.',
        prs: [],
      },
    ],
  },
  {
    version: '0.12.2',
    date: 'May 31, 2026',
    codename: 'Accessible Lightbox',
    summary:
      'Accessibility polish across the gallery and lightbox: the lightbox is now an announced modal that returns keyboard focus to the export you opened, the search field carries an accessible name, and motion now respects your system preferences.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: Eye,
        text:
          'The export lightbox is now exposed to assistive tech as a modal dialog and restores keyboard focus to the gallery card you opened when it closes.',
        prs: [],
      },
      {
        kind: 'improved' as ChangeKind,
        icon: Eye,
        text:
          'The gallery search field now has an accessible label, the brand link is labelled in lowercase, and decorative icons are hidden from screen readers.',
        prs: [],
      },
      {
        kind: 'improved' as ChangeKind,
        icon: Zap,
        text:
          'Animations, the skeleton pulse, and the lightbox spinner now honour the operating system "reduce motion" setting.',
        prs: [],
      },
    ],
  },
  {
    version: '0.12.1',
    date: 'May 31, 2026',
    codename: 'Error Capture',
    summary:
      'Showroom now automatically captures client-side errors and forwards them to the SwissNovo suite-wide error log via @aireon/shared v0.42.0.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: Bug,
        text:
          'Uncaught client errors are now captured automatically and reported to the central SwissNovo error log, so regressions surface faster across the suite.',
        prs: [],
      },
    ],
  },
  {
    version: '0.12.0',
    date: 'May 27, 2026',
    codename: 'Inter Polish',
    summary:
      'Typography refresh aligning showroom with the SwissNovo suite: UI body, headings, and search inputs now ride on Inter (variable, OpenType cv11 + ss01 + tabular figures, antialiased) for a more professional tech-grade dark look. Three tokens now drive every font choice in the app: --hood-font (Inter, UI), --hood-display (Varela Round, wordmark only), --hood-mono (JetBrains Mono, IDs and code).',
    highlight: true,
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: Type,
        text:
          'UI body, headings, and search inputs now ride on Inter (variable, OpenType cv11 + ss01 + tabular figures, antialiased) for a more professional tech-grade dark look.',
        prs: [],
      },
      {
        kind: 'improved' as ChangeKind,
        icon: BadgeCheck,
        text:
          'Brand wordmark untouched: the showroom logo stays in Varela Round with the red `oo`, now routed through the new --hood-display token.',
        prs: [],
      },
      {
        kind: 'improved' as ChangeKind,
        icon: Code2,
        text:
          'IDs and code surfaces switch to JetBrains Mono via the new --hood-mono token — parcel IDs, EGRID chips, and metadata panel rows render in the suite mono face.',
        prs: [],
      },
    ],
  },
  {
    version: '0.11.1',
    date: 'May 26, 2026',
    codename: 'Quiet Check-In',
    summary:
      'Release-notes button now uses the circle-check icon (matches the rest of the suite).',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: Package,
        text: 'Bumped @aireon/shared to v0.32.0 — release-notes button icon switched from Tag to CheckCircle.',
        prs: [],
      },
    ],
  },
  {
    version: '0.11.0',
    date: 'May 25, 2026',
    codename: 'PRM',
    summary:
      'Save parcels to your PRM list and reopen them from the user menu. The Reporter\'s parcel strip now carries a "Save to PRM" button next to the EGRID — one click pins the parcel to your personal register; once saved a small "Open in proom" shortcut appears next to it. The user menu gets a new "My saved parcels" entry that opens the shared saved-parcels modal; picking "Open here" reloads the Reporter at that parcel\'s coordinates.',
    highlight: true,
    items: [
      {
        kind: 'new' as ChangeKind,
        icon: Bookmark,
        text:
          'New "Save to PRM" button on the Reporter parcel strip, right next to the EGRID chip. Saves the searched parcel (id, address/coords label, locality, footprint, lat/lng) to your personal register via @aireon/shared. Already-saved parcels light up green on load.',
        prs: [],
      },
      {
        kind: 'new' as ChangeKind,
        icon: CircleUser,
        text:
          'User menu now has a "My saved parcels" entry that opens the shared SavedParcelsModal — list, filter, manage states/priorities/tags, jump to proom, or "Open here" to reload the Reporter at the parcel\'s coordinates.',
        prs: [],
      },
      {
        kind: 'improved' as ChangeKind,
        icon: Globe,
        text:
          'New PRM strings (save / saved / saving / save_failed / signin_required / open_in_proom) and the "My saved parcels" menu entry are translated EN / FR / DE / IT.',
        prs: [],
      },
    ],
  },
  {
    version: '0.10.1',
    date: 'May 23, 2026',
    codename: 'Tidy Header',
    summary:
      'Header cleanup: the release-notes button moves over to the right side of the header (next to the language selector) and shrinks to a single icon. Unread notes still ping you with the red dot.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: Sparkles,
        text:
          'Release-notes button is now an icon next to the language selector (replaces the version pill next to the wordmark).',
        prs: [],
      },
    ],
  },
  {
    version: '0.10.0',
    date: 'May 21, 2026',
    codename: 'Property Dossier',
    summary:
      'The Reporter now generates a downloadable, multi-page PDF property report. Pick which of the five live cards belong in the dossier with the new "Add to report" checkbox in each card, hit "Generate report" and Showroom assembles a Swiss-format property dossier with a branded cover, executive summary, parcel identification sheet (address, EGRID, footprint, volume, dwellings, zoning), per-widget analyses with map snapshots and methodology bullets, and a sourced disclaimer modelled on Swiss AVM practice. The PDF is fully translated EN / FR / DE / IT.',
    highlight: true,
    items: [
      {
        kind: 'new' as ChangeKind,
        icon: FileBarChart,
        text:
          'Each Reporter card now carries an "Add to report" checkbox at the top-left (mirroring the live status badge on the right). All five cards are pre-selected; un-tick what you don\'t want in the dossier.',
        prs: [],
      },
      {
        kind: 'new' as ChangeKind,
        icon: FileBarChart,
        text:
          'New "Generate report" action next to the existing Regenerate button. Showroom captures a high-DPI snapshot of every selected card, then renders an A4 multi-page PDF with @react-pdf/renderer — vector text, embedded map images, page numbers, and a fixed footer carrying the report ID.',
        prs: [],
      },
      {
        kind: 'new' as ChangeKind,
        icon: FileBarChart,
        text:
          'Report structure (industry-aligned Swiss AVM layout): branded cover with hero snapshot, address, EGRID, report ID and timestamp; executive KPI grid; parcel identification sheet (address, locality, EGRID, zone, footprint, volume, dwellings, coordinates); one analysis section per selected widget (headline metric · map snapshot · narrative · methodology bullets · source citation); closing sources page with a Swiss AVM-style disclaimer that explicitly states the report is not a certified Verkehrswertschätzung under Art. 12 BankV / RICS / SVS / SEK-SVIT.',
        prs: [],
      },
      {
        kind: 'improved' as ChangeKind,
        icon: Type,
        text:
          'MapboxMini now initialises with preserveDrawingBuffer so the Valoo / Roofs WebGL canvases can be captured into the PDF without coming out blank.',
        prs: [],
      },
      {
        kind: 'improved' as ChangeKind,
        icon: Globe,
        text:
          'Every label in the new flow — checkbox states, the Generate button, the capture/render dialog and the PDF document itself (cover, sections, fact labels, methodology titles, footer, full Swiss disclaimer) — is translated EN / FR / DE / IT and follows the active language selector.',
        prs: [],
      },
    ],
  },
  {
    version: '0.9.4',
    date: 'May 21, 2026',
    codename: 'Card Frame',
    summary:
      'OG / social-preview image now matches the live toolbox card hover thumbnail — the same shot users already see when hovering this app on toolbox.swissnovo.com.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: Sparkles,
        text: 'Swapped public/og-image.jpg for the toolbox front-page hover thumbnail and refreshed og:image:width/height meta so link previews on Discord, Slack, WhatsApp etc. now show the same artwork as the toolbox card.',
        prs: [],
      },
    ],
  },
  {
    version: '0.9.3',
    date: 'May 21, 2026',
    codename: 'Login Actually Unstuck',
    summary:
      'Fixed a hang on first load where the page would never settle to the login screen. The hidden sign-in check now always clears within 8 s and the sign-in dialog appears.',
    items: [
      {
        kind: 'fixed' as ChangeKind,
        icon: Shield,
        text: 'The hidden silent-SSO iframe was blocked by Zitadel\'s login UI (Content-Security-Policy: frame-ancestors \'none\') and the in-library timeout did not propagate through React 18 strict-mode\'s double-render — so the app stayed on its loading skeleton indefinitely. The shared AuthProvider now runs an 8 s death-switch in its own effect and listens for sign-in events per-mount, guaranteeing the loading state clears even when the silent check itself hangs.',
        prs: [],
      },
      {
        kind: 'improved' as ChangeKind,
        icon: Package,
        text: 'Picked up @aireon/shared v0.17.2.',
        prs: [],
      },
    ],
  },
  {
    version: '0.9.2',
    date: 'May 20, 2026',
    codename: 'Deep Translation',
    summary:
      'The language selector now drives the whole gallery, the lightbox and the Reporter — not just the navbar. Switch EN / FR / DE / IT and the page title, sort dropdown, filter chips, image-detail panel, saved-parcels drawer and every widget label re-render in your language.',
    items: [
      {
        kind: 'new' as ChangeKind,
        icon: Globe,
        text: 'Deep translation pass across the body of the app. Gallery heading, the "X of Y exports" counter, the favorites / view-mode / refresh controls, the sort dropdown ("Recently added", "Oldest first", "Most exports", "A → Z"), the per-app filter pills and Clear link, every empty / error state, and the keyboard-tips footer all read in EN / FR / DE / IT. The lightbox controls (Download, Open original, Delete, Show info, Close, prev / next) and the side metadata panel (Location, Capture, Address, Parcel ID, Dimensions, Size, Zoom, Tilt, Bearing, Basemap, 3D mode On/Off) are translated. The parcel-group headers ("Parcel …", "Unassigned exports", "{n} exports", "show all"), the saved-parcels drawer (title, search, state and priority filters, badges, empty / no-matches states, "Manage parcels in Roofs"), and the Reporter page (kicker, intro paragraph, "Regenerate", parcel strip "Parcel details unavailable" / "{n} flat(s)", widget status badges Live / Loading / No data / Failed, metric labels Market value / Building height / Construction year / Solar potential / Road noise, Retry, "Open … at this location") are all wired up. Deferred-English: the swissnovo wordmark, per-app brand names (scoore, footprint, valoo, …) and addresses returned by the geocoder. The translation runtime now supports {placeholder} interpolation.',
        prs: [],
      },
    ],
  },
  {
    version: '0.9.1',
    date: 'May 20, 2026',
    codename: 'Four Tongues',
    summary:
      'Language selector in the navbar — pick EN / FR / DE / IT and the choice is remembered. First pass translates the navbar shell; the gallery, reporter and lightbox copy remain English for now.',
    items: [
      {
        kind: 'added' as ChangeKind,
        icon: Globe,
        text: 'A new language dropdown appears in the navbar (the shared suite primitive used by scoore, toolbox and footprint). Switch between English, French, German, Italian — the search placeholder translates immediately and your choice persists per browser. Deeper screens (gallery filters, reporter widgets, lightbox controls) still display in English; those strings are a follow-up.',
        prs: [],
      },
      {
        kind: 'improved' as ChangeKind,
        icon: Package,
        text: 'Picked up @aireon/shared v0.16.0 (LocaleSelector primitive).',
        prs: [],
      },
    ],
  },
  {
    version: '0.9.0',
    date: 'May 19, 2026',
    codename: 'Warm Handshake',
    summary: 'The sign-in check on first load starts a little sooner.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: Zap,
        text: 'The page now opens its connection to the Zitadel sign-in server up front (a preconnect hint), so the silent sign-in check on load no longer waits on a cold DNS lookup and TLS handshake before it can start.',
        prs: [],
      },
    ],
  },
  {
    version: '0.8.9',
    date: 'May 19, 2026',
    codename: 'Brisk Welcome',
    summary:
      'The sign-in check on first load no longer stalls for ~10 seconds.',
    items: [
      {
        kind: 'fixed' as ChangeKind,
        icon: Zap,
        text: 'Fixed a ~10s delay before the app knew you were signed out — the silent SSO check stalled fetching a library from a CDN inside a hidden iframe; it now resolves instantly.',
        prs: [],
      },
    ],
  },
  {
    version: '0.8.8',
    date: 'May 19, 2026',
    codename: 'Centred Profile',
    summary:
      'Upgraded to @aireon/shared v0.13.1, which fixes the shared ProfileModal and LoginModal so they render via a React portal — no longer clipped by the app navbar.',
    items: [
      {
        kind: 'fixed' as ChangeKind,
        icon: Bug,
        text: 'The View profile panel no longer gets clipped at the top — it now always centres on screen.',
        prs: [],
      },
    ],
  },
  {
    version: '0.8.7',
    date: 'May 19, 2026',
    codename: 'One Profile',
    summary:
      '"View profile" is now the suite-standard experience from @aireon/shared v0.13.0 — the same identity card, avatar picker and editable details as every other SwissNovo app.',
    items: [
      {
        kind: 'improved' as ChangeKind,
        icon: CircleUser,
        text: 'The inline profile modal and separate "Change avatar" item in the user menu are replaced by the shared ProfileModal from @aireon/shared v0.13.0. Avatar selection now lives inside "View profile", the avatar in the header updates immediately via useUserProfile, and the experience is identical suite-wide.',
        prs: [],
      },
      {
        kind: 'improved' as ChangeKind,
        icon: Zap,
        text: 'Upgraded Mapbox GL JS to v3.24.0 for rendering performance improvements.',
        prs: [],
      },
    ],
  },
  {
    version: '0.8.6',
    date: 'May 19, 2026',
    codename: 'Calm Loading',
    summary:
      'Every loading state in Showroom now uses the shared design-system skeleton — a calm, slow opacity blink — instead of spinners and the old custom shimmer. The app-boot screen, the gallery grid, the saved-parcels panel, the Reporter page and its widget maps, the parcel-info strip and each gallery thumbnail all fade in on a placeholder shaped like the real layout. In-button busy spinners are kept as-is.',
    items: [
      {
        kind: 'improved',
        icon: Layers,
        text: 'All content-area loading states were migrated to the shared @aireon/shared Skeleton primitive: the app-boot screen now shows a faux navbar plus a thumbnail grid instead of a centred spinner; the gallery and grouped gallery, the saved-parcels panel, the Reporter page skeleton and its widget map placeholders, the parcel-info chip strip, the user-menu avatar, and each gallery card thumbnail all render the calm 1.8 s blink. The old custom animate-shimmer CSS keyframe is removed.',
        prs: [],
      },
    ],
  },
  {
    version: '0.8.5',
    date: 'May 19, 2026',
    codename: 'Holding Shape',
    summary:
      'Two Reporter polish fixes. Opening a /reporter link now shows a skeleton of the page — a faux navbar and five card placeholders — while the map bundle loads, instead of a centred spinner. And every card’s headline value now renders in the same cyan with a soft dark halo, so it stays legible over any basemap.',
    items: [
      {
        kind: 'improved',
        icon: LayoutGrid,
        text: 'Opening the Reporter (or a shared /reporter link) now shows a skeleton of the page layout — a faux navbar and five shimmer card placeholders — while the lazy map bundle downloads, instead of a centred loading spinner.',
        prs: [],
      },
      {
        kind: 'fixed',
        icon: Eye,
        text: 'The card headline value is now a single consistent cyan with a soft dark text halo, so it stays readable over any basemap colour. The Boom road-noise value previously took the noise-band colour (a green) and washed out against the noise overlay.',
        prs: [],
      },
    ],
  },
  {
    version: '0.8.4',
    date: 'May 19, 2026',
    codename: 'In Plain Sight',
    summary:
      'Fixes the three Reporter cards built on Leaflet — Roots, Soolar and Boom — which showed neither their headline value nor a status badge. Leaflet stacks its map panes at a z-index that leaked past the card chrome and painted over them; the map now sits in its own isolated layer, so the value and badge render on top as intended. The status badge is also restyled for legibility, and the Mapbox logo no longer collides with the value.',
    highlight: true,
    items: [
      {
        kind: 'fixed',
        icon: Bug,
        text: 'The Roots, Soolar and Boom cards now show their headline value (construction year, solar potential, road-noise band) and status badge. Their Leaflet maps render internal panes at a z-index of up to ~1000; because the map container was not an isolated stacking context, that range painted over the card’s value overlay and badge. The Leaflet and Mapbox map containers now use `isolation: isolate`, keeping the map a self-contained layer beneath the card chrome.',
        prs: [],
      },
      {
        kind: 'improved',
        icon: Eye,
        text: 'The Live / Loading / No data / Failed status badge is now an opaque dark pill with a coloured status dot, instead of a translucent tint that washed out over light or busy basemaps.',
        prs: [],
      },
      {
        kind: 'fixed',
        icon: ImageIcon,
        text: 'On the Mapbox cards (Valoo, Roofs) the required Mapbox logo no longer sits underneath the headline value — the logo and attribution move to the top-left corner, clear of the value overlay.',
        prs: [],
      },
    ],
  },
  {
    version: '0.8.3',
    date: 'May 19, 2026',
    codename: 'Easy Pulse',
    summary:
      'The skeleton-loader shimmer animation is now calmer — slowed from 1.6 s to 2.5 s so loading states feel less frantic.',
    items: [
      {
        kind: 'improved',
        icon: Layers,
        text: 'Slowed the skeleton-loader shimmer to a calmer pace.',
        prs: [],
      },
    ],
  },
  {
    version: '0.8.2',
    date: 'May 19, 2026',
    codename: 'Members Only',
    summary:
      'A cleaner sign-in screen. The login card drops the redundant "Sign in to" line, spells out that Showroom is members-only, and removes the feature chips that did not add much.',
    items: [
      {
        kind: 'improved',
        icon: KeyRound,
        text: 'The login card heading is now just the "showroom" wordmark under SWISSNOVO — the "Sign in to" prefix was redundant next to the Create-account / Sign-in buttons. The description now states up front that Showroom is members-only, and the three feature chips ("Smart parcel grouping" etc.) are removed for a tighter, less busy card.',
        prs: [],
      },
    ],
  },
  {
    version: '0.8.1',
    date: 'May 19, 2026',
    codename: 'Shimmering Strip',
    summary:
      'The parcel-info strip in the Reporter now shows shimmer chip skeletons while it fetches, matching the shape of the real chips, instead of a plain "Loading parcel details…" text line.',
    items: [
      {
        kind: 'improved',
        icon: Layers,
        text: 'ParcelInfoStrip loading state replaced with six staggered animate-shimmer chip skeletons (h-7, rounded-lg, varying widths) that mirror the final chip row, eliminating the last plain-text loading message in the reporter view.',
        prs: [],
      },
    ],
  },
  {
    version: '0.8.0',
    date: 'May 18, 2026',
    codename: 'Headline Stats',
    summary:
      'The Reporter cards now lead with their number. Each widget’s headline value — valuation, building height, construction year, solar yield, road noise — is rendered large and high-contrast over the foot of its map, under a label naming what it measures, with the status badge moved to the top corner. Below the card grid, a new parcel strip shows the general facts of the searched parcel — address, EGRID, building size and volume, number of flats, zone and coordinates — pulled live from the RES API.',
    highlight: true,
    items: [
      {
        kind: 'improved',
        icon: Type,
        text: 'Each reporter card’s headline value is now large, bold and colour-coded over a gradient scrim at the foot of its map, with an uppercase metric label (“Market value”, “Building height”, “Construction year”, “Solar potential”, “Road noise”) above it. The Live / No data / Failed status badge moved to a top-right map overlay, and the card footer is simplified to the app name and a deep-link.',
        prs: [],
      },
      {
        kind: 'new',
        icon: MapPin,
        text: 'A new parcel-info strip sits below the report grid — a row of chips with the searched parcel’s address, EGRID, building size (m²) and volume (m³), number of flats, zoning and coordinates. The data comes from the RES API’s parcel_data endpoint via a new /api/parcel-data Vercel edge function; if the lookup is unavailable the strip degrades quietly and the cards are unaffected.',
        prs: [],
      },
    ],
  },
  {
    version: '0.7.0',
    date: 'May 18, 2026',
    codename: 'One Front Door',
    summary:
      'The sign-in screen is now the suite-standard login modal from @aireon/shared — the same branded popup every Swissnovo app will use. Showroom no longer ships its own SignInGate; the shared component keeps the SWISSNOVO wordmark and the gallery feature list, and the rest of the suite picks up an identical sign-in experience.',
    items: [
      {
        kind: 'improved',
        icon: KeyRound,
        text: 'Showroom’s bespoke SignInGate is replaced by the shared LoginModal. Because showroom is private to your account, it stays a hard gate — the modal is shown, non-dismissible, until you sign in — but the markup, branding and buttons are now the single suite-wide component instead of a one-off.',
        prs: [],
      },
      {
        kind: 'improved',
        icon: Package,
        text: 'Upgraded @aireon/shared to v0.10.0, which adds the standard LoginModal plus requireAuth()/promptLogin() helpers so any app can gate a feature behind the same sign-in popup.',
        prs: [],
      },
    ],
  },
  {
    version: '0.6.2',
    date: 'May 18, 2026',
    codename: 'Brand First',
    summary:
      'The sign-in page leads with the brand. The blue gradient icon tile above the headline is replaced by the SWISSNOVO wordmark, set in the suite Varela Round face with the two O’s in signature red — the same treatment as the toolbox home page.',
    items: [
      {
        kind: 'improved',
        icon: Type,
        text: 'The sign-in gate no longer shows a generic blue gallery-icon tile. In its place sits the SWISSNOVO wordmark in Varela Round with red O’s, matching the toolbox app and tying the login screen to the rest of the suite branding.',
        prs: [],
      },
    ],
  },
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
      'Sign-in is now powered by the shared @aireon/shared package — the OIDC auth layer is de-duplicated across the SwissNovo suite. The sign-in experience is unchanged.',
    items: [
      {
        kind: 'improved',
        icon: Package,
        text: 'OIDC authentication (sign-in, sign-up, single sign-on, token refresh) now comes from the shared @aireon/shared package instead of a per-app copy. The UX is identical, but auth fixes and improvements now roll out suite-wide from one source.',
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
      'The release-notes panel is now provided by the shared @aireon/shared package instead of a copy-pasted component — the first step in de-duplicating common code across the SwissNovo suite.',
    items: [
      {
        kind: 'improved',
        icon: Package,
        text: 'ReleaseNotesButton and ReleaseNotesPanel now come from the shared @aireon/shared package. The UI is unchanged, but changelog bug fixes and improvements now roll out suite-wide from one source instead of being hand-applied per app.',
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
