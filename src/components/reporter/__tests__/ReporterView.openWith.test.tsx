// Contract: the reporter's "Open with" handoff is the branded showroom
// wordmark seated INSIDE the address field, not a bare external-link glyph out
// in the navbar — and it is on screen exactly once.
//
// This renders the REAL ReporterView through the REAL shared
// AddressSearch/OpenWithMenu chain and the REAL showroom Navbar. Only
// showroom's own heavy report machinery (the widget grid, the PDF dialog,
// Claire, the parcel strip) and the network-touching helpers are replaced, so
// nothing about the handoff itself is faked.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GlassProvider } from '@aireon/shared';

import { I18nProvider } from '../../../contexts/I18nContext';
import ReporterView from '../ReporterView';

vi.mock('../ReportGrid', () => ({ default: () => null }));
vi.mock('../ParcelInfoStrip', () => ({ default: () => null }));
vi.mock('../ReporterClaire', () => ({ default: () => null }));
vi.mock('../report/ReportDialog', () => ({ default: () => null }));
vi.mock('../../UserMenu', () => ({ default: () => <button type="button">Account</button> }));
vi.mock('../../../lib/geocode', () => ({
  geocodeAddress: vi.fn(async () => []),
  isGeocodingConfigured: true,
}));
vi.mock('../../../lib/reportAddress', () => ({ resolveReportAddress: vi.fn(async () => null) }));
vi.mock('../../../lib/signal', () => ({ signal: { send: vi.fn() } }));
vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ status: 'authenticated', login: vi.fn(), getAccessToken: () => null }),
}));

// A location must be in the URL before the FIRST mount in this file: the
// reporter reads its coordinates from the query string, and the shared URL
// helpers cache theirs at module level.
window.history.replaceState({}, '', '/reporter?lat=46.123456&lng=7.654321&q=Test+street+1');

/** Pin the viewport branch: `matches` false = desktop, true = compact. */
function stubViewport(compact: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: compact,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

let container: HTMLDivElement;
let root: Root;

function tree(node: ReactNode) {
  return (
    <GlassProvider>
      <I18nProvider>{node}</I18nProvider>
    </GlassProvider>
  );
}

/**
 * Settled render: `act()` flushes passive effects before it returns, so every
 * assertion made after this observes the POST-effect DOM — the steady state,
 * never the frame React committed first.
 */
function render(node: ReactNode) {
  act(() => {
    root.render(tree(node));
  });
}

/**
 * FIRST COMMITTED PAINT: render and commit exactly one pass with passive
 * effects still unflushed.
 *
 * This exists because `render()` above cannot see the only frame where a
 * first-paint bug lives. `flushSync` commits the render synchronously and
 * leaves `useEffect` work on the scheduler queue, so the DOM left behind is
 * what a phone actually paints before any effect has had a chance to correct
 * it. A breakpoint hook that answers "desktop" on first render and fixes itself
 * in an effect passes every assertion in the settled blocks below and fails
 * here — which is the point.
 *
 * The act-environment flag is lowered for the duration so React does not warn
 * about an update outside `act()`, and raised again immediately afterwards so
 * teardown still runs inside `act()`.
 */
function renderFirstPaint(node: ReactNode) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', false);
  try {
    flushSync(() => {
      root.render(tree(node));
    });
  } finally {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  }
}

function openWithTriggers() {
  return Array.from(container.querySelectorAll('button')).filter((button) =>
    (button.getAttribute('aria-label') ?? '').startsWith('Open with'),
  );
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('reporter Open With handoff — desktop', () => {
  beforeEach(() => {
    stubViewport(false);
    render(<ReporterView />);
  });

  it('shows the showroom wordmark inside the address field, not an external-link icon', () => {
    const trigger = openWithTriggers()[0];

    expect(trigger).toBeInstanceOf(HTMLButtonElement);
    expect(trigger.getAttribute('aria-label')).toBe('Open with: showroom');
    expect(trigger.classList.contains('aireon-openwith-trigger--target')).toBe(true);
    // The icon trigger this replaces. Its survival is the whole bug.
    expect(trigger.querySelector('.lucide-external-link')).toBeNull();
    expect(trigger.textContent).toBe('showroom');
    // The suite wordmark cut: the "oo" is the accented half.
    expect(trigger.querySelector('.aireon-wm-oo')?.textContent).toBe('oo');
    expect(
      Array.from(trigger.querySelectorAll('.aireon-wm-base')).map((part) => part.textContent),
    ).toEqual(['showr', 'm']);
    // Seated in the address field's own frame, behind its hairline divider.
    expect(trigger.closest('.aireon-search-trailing')).not.toBeNull();
  });

  it('renders the handoff exactly once — the navbar must not show a second one', () => {
    expect(openWithTriggers()).toHaveLength(1);
    expect(container.querySelectorAll('.aireon-openwith-trigger')).toHaveLength(1);
    // ...and the one on screen is the wordmark, never the bare glyph.
    expect(container.querySelectorAll('.aireon-openwith-trigger--target')).toHaveLength(1);
  });
});

describe('reporter Open With handoff — compact', () => {
  beforeEach(() => {
    stubViewport(true);
    render(<ReporterView />);
  });

  it('leaves the address field untouched instead of hiding a trailing node with CSS', () => {
    // A CSS-hidden node is still truthy, so the field would keep its reflowed
    // trailing layout and paint an orphan divider stub inside the frame.
    // Nothing may be there at all.
    //
    // SETTLED STATE ONLY. This renders through act(), so it cannot distinguish
    // "never had a trailing node" from "had one for the first frame and dropped
    // it in an effect". The first-paint block below is what covers that frame.
    expect(container.querySelector('.aireon-search-trailing')).toBeNull();
    expect(container.querySelector('.aireon-search-field--trailing')).toBeNull();
  });

  it('keeps the handoff reachable behind the navbar overflow menu', () => {
    // Compact folds the whole actions block into one ⋯ menu, so nothing is on
    // the bar until it is opened — but the handoff is still there.
    expect(openWithTriggers()).toHaveLength(0);

    const more = Array.from(container.querySelectorAll('button')).find(
      (button) => button.getAttribute('aria-label') === 'More',
    );
    expect(more).toBeInstanceOf(HTMLButtonElement);
    act(() => more!.click());

    const trigger = openWithTriggers()[0];
    expect(trigger).toBeInstanceOf(HTMLButtonElement);
    expect(openWithTriggers()).toHaveLength(1);
    expect(trigger.closest('.aireon-search-trailing')).toBeNull();
  });

  it('keeps the narrow icon trigger where the wordmark would not fit', () => {
    // The wordmark trigger is ~40px wider than the glyph. Inside the folded ⋯
    // row there is no address field to seat it in and no room to spend, so
    // compact deliberately keeps the compact shape.
    const more = Array.from(container.querySelectorAll('button')).find(
      (button) => button.getAttribute('aria-label') === 'More',
    );
    act(() => more!.click());

    expect(container.querySelectorAll('.aireon-openwith-trigger')).toHaveLength(1);
    expect(container.querySelectorAll('.aireon-openwith-trigger--target')).toHaveLength(0);
  });
});

describe('reporter Open With handoff — compact, first committed paint', () => {
  // The frame the settled block above is structurally unable to see. The gate
  // that decides whether AddressSearch gets a `trailing` node has to be right
  // on the FIRST render, not one effect later: `trailing` being truthy is what
  // moves the field's border and background off the <input> onto the wrapper,
  // turns the clear button and spinner into in-flow flex items and paints the
  // `.aireon-search-trailing::before` hairline stub. Getting it wrong for one
  // frame is a visible flash on a 375px field, not a technicality.
  beforeEach(() => {
    stubViewport(true);
    renderFirstPaint(<ReporterView />);
  });

  it('never hands the address field a trailing node, not even for one frame', () => {
    // Guard the guard: if the field itself had not rendered on this pass, the
    // three absences below would prove nothing at all.
    expect(container.querySelector('.aireon-search-field')).not.toBeNull();

    expect(container.querySelector('.aireon-search-field--trailing')).toBeNull();
    expect(container.querySelector('.aireon-search-trailing')).toBeNull();
    expect(container.querySelectorAll('.aireon-openwith-trigger')).toHaveLength(0);
  });

  it("flips in lockstep with AppNavbar's own fold, on that same frame", () => {
    // AppNavbar reads its `mobileCollapseBelow` (768) through the shared
    // nav-internal useMediaQuery, which is synchronous for exactly this reason,
    // so the bar has ALREADY folded its actions into the ⋯ menu on this first
    // pass. showroom's own gate has to be synchronous too, or for one frame the
    // in-field wordmark paints while the bar beside it is already compact.
    const more = Array.from(container.querySelectorAll('button')).find(
      (button) => button.getAttribute('aria-label') === 'More',
    );
    expect(more).toBeInstanceOf(HTMLButtonElement);
    expect(container.querySelector('.aireon-search-trailing')).toBeNull();
  });
});
