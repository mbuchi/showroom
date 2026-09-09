import { useEffect, useState } from 'react';

/**
 * The width at which the shared `AppNavbar` folds its whole actions cluster
 * into a single ⋯ menu — its `mobileCollapseBelow` default. showroom's
 * "Open with" handoff changes hands at exactly this width: below it the navbar
 * keeps the narrow icon trigger, from it up the branded wordmark sits inside
 * the reporter's own address field.
 */
export const COMPACT_LAYOUT_BREAKPOINT = 768;

const QUERY = `(max-width: ${COMPACT_LAYOUT_BREAKPOINT - 1}px)`;

/** Render-free read of the current viewport against the compact query. */
export function matchesCompactLayout(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(QUERY).matches;
}

/**
 * showroom's compact-layout switch — modelled on geopool's `useCompactLayout`
 * and doorway's `useMediaQuery`, the house precedent for a repo-local
 * SYNCHRONOUS breakpoint hook.
 *
 * The initial read is synchronous: `matchMedia` runs in the `useState`
 * initialiser, so the very first render already knows it is on a phone.
 *
 * That is the entire reason this hook exists rather than the exported
 * `useIsMobile` from @aireon/shared, which must NOT be used for these call
 * sites. `useIsMobile` returns `false` on the server and on first paint by
 * design, syncing only in a post-mount effect — its docblock is explicit that
 * "desktop is the common case, never flickers mobile". That default is right
 * for a decision like "should this icon be in the bar", whose false branch
 * costs nothing for a frame. It is wrong for any decision whose FALSE BRANCH
 * CHANGES LAYOUT, which is what this one is: `false` hands `AddressSearch` a
 * real `trailing` node, and AddressSearch keys its framed layout off `trailing`
 * being truthy — the border and background move off the <input> onto the
 * wrapper, the clear button and spinner become in-flow flex items, and the
 * `.aireon-search-trailing::before` hairline stub paints. With a post-mount
 * hook a phone commits that reflowed field on its first frame and drops it on
 * the next: a real flash, not a technicality.
 *
 * It also keeps showroom's two gates (`components/Navbar.tsx` and
 * `components/reporter/ReporterView.tsx`) in step at the same instant.
 * AppNavbar resolves its own `collapseBelow` through the shared nav-internal
 * `useMediaQuery`, which is synchronous for exactly this reason and is not
 * exported from the package root. Matching it here means showroom's handoff
 * flips on the same frame the bar changes shape, so the control is never
 * briefly doubled and never briefly missing.
 */
export function useCompactLayout(): boolean {
  const [compact, setCompact] = useState(matchesCompactLayout);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia(QUERY);
    const sync = () => setCompact(query.matches);
    sync();
    // Safari < 14 only supports the deprecated addListener signature.
    if (query.addEventListener) query.addEventListener('change', sync);
    else query.addListener(sync);
    return () => {
      if (query.removeEventListener) query.removeEventListener('change', sync);
      else query.removeListener(sync);
    };
  }, []);
  return compact;
}

export default useCompactLayout;
