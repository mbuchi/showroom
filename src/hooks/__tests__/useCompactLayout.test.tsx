// Contract: useCompactLayout answers on the FIRST render pass, not one effect
// later.
//
// This is the property both "Open with" gates depend on (components/Navbar.tsx
// and components/reporter/ReporterView.tsx), and the only thing separating this
// hook from the exported `useIsMobile` it replaces. A test that renders through
// act() cannot see it — act() flushes passive effects before it returns, so the
// post-mount correction has already landed by the time any assertion runs.
// Everything here therefore renders with flushSync, outside act().
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { COMPACT_LAYOUT_BREAKPOINT, matchesCompactLayout, useCompactLayout } from '../useCompactLayout';

let container: HTMLDivElement;
let root: Root;
let listeners: ((event: unknown) => void)[];

/** Pin the viewport branch and capture whatever `change` listener is attached. */
function stubViewport(compact: boolean) {
  listeners = [];
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: compact,
      addEventListener: (_type: string, listener: (event: unknown) => void) => {
        listeners.push(listener);
      },
      removeEventListener: vi.fn(),
    }),
  );
}

/** Every value the hook returned, oldest first. `seen[0]` is the first paint. */
let seen: boolean[];

function Probe() {
  seen.push(useCompactLayout());
  return null;
}

/** Commit one render pass WITHOUT flushing passive effects. */
function renderFirstPaint() {
  seen = [];
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', false);
  try {
    flushSync(() => {
      root.render(<Probe />);
    });
  } finally {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  }
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

describe('useCompactLayout', () => {
  it('matches the shared AppNavbar fold', () => {
    // Not Tailwind's 640px `sm`: this must be AppNavbar's own
    // `mobileCollapseBelow` default, or the handoff has a gap or an overlap.
    expect(COMPACT_LAYOUT_BREAKPOINT).toBe(768);
  });

  it('reports compact on the very first render pass, before any effect runs', () => {
    stubViewport(true);
    renderFirstPaint();

    // The whole point. `useIsMobile` yields [false, true] here — one desktop
    // frame, then the correction.
    expect(seen).toEqual([true]);
  });

  it('reports wide on the first pass on a desktop viewport', () => {
    stubViewport(false);
    renderFirstPaint();

    expect(seen).toEqual([false]);
  });

  it('still tracks later viewport changes', () => {
    // Synchronous first read must not cost the subscription: a rotate or a
    // resize past the fold has to move the handoff.
    const mql = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    listeners = [];
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => {
        mql.addEventListener.mockImplementation((_type: string, listener: () => void) => {
          listeners.push(listener);
        });
        return mql;
      }),
    );

    seen = [];
    act(() => {
      root.render(<Probe />);
    });
    expect(seen[seen.length - 1]).toBe(false);

    mql.matches = true;
    act(() => {
      for (const listener of listeners) listener(undefined);
    });
    expect(seen[seen.length - 1]).toBe(true);
  });

  it('answers false rather than throwing where there is no matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(matchesCompactLayout()).toBe(false);
  });
});
