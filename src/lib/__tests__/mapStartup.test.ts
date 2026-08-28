// The MapLibre startup contract for the reporter's mini-maps.
//
// ⚠ MapLibre v6 does NOT throw when the WebGL2 context is refused. Its
// constructor runs `this._setupPainter(); if (!this.painter) return;`
// (maplibre-gl 6.3.0), fires a `GPUInitializationError` at the half-built map,
// and hands back a `Map` that looks constructed but has no painter, no style
// and no handlers. So a `try { new maplibregl.Map(...) } catch {}` is
// UNREACHABLE for the one cause people write it for, and the half-built
// instance goes on to detonate somewhere unrelated:
//
//   - `resize()` -> `_resizeInternal` -> `this.painter.resize(...)`
//     => `Cannot read properties of undefined (reading 'resize')`
//   - `Marker.addTo` -> project through the painter transform => `...'0'`
//   - the cleanup's `remove()` -> `this.painter.destroy()` => `...'destroy'`
//
// MapboxMini owned two of those live surfaces: a bare
// `requestAnimationFrame(() => m.resize())` a frame after the promise chain had
// exited (so uncaught — no ErrorBoundary sees it) and a bare `map?.remove()` in
// the effect cleanup.
//
// This file pins the contract that actually holds — preflight, painter gate
// before the instance is used, a re-checking rAF callback, guarded teardown —
// against a fake engine that reproduces the real failure, so it fails when the
// BEHAVIOR regresses and not merely when wording moves. The source pins at the
// bottom keep the components wired to that behavior.
//
// Suite memory: maplibre-gpu-init-returns-half-built-map (hexoo #129,
// doorway #225, hood #280, choose #263).

import { beforeEach, describe, expect, it, vi } from 'vitest';

const probe = vi.fn(() => true);
vi.mock('@aireon/shared/webgl', () => ({
  isWebGLAvailable: () => probe(),
  MapUnavailable: () => null,
}));

import miniSource from '../../components/reporter/MapboxMini.tsx?raw';
import roofsSource from '../../components/reporter/widgets/RoofsWidget.tsx?raw';
import valooSource from '../../components/reporter/widgets/ValooWidget.tsx?raw';
import {
  MapStartupUnsupportedError,
  __resetWebglProbeForTest,
  isMapUsable,
  webglSupported,
} from '../mapStartup';

/** Fails loudly instead of silently satisfying an ordering assertion at -1. */
const at = (source: string, label: string, needle: string) => {
  const index = source.indexOf(needle);
  expect(index, `${label} no longer contains ${JSON.stringify(needle)}`).not.toBe(-1);
  return index;
};

/**
 * A stand-in for maplibre-gl v6's real failure mode: the painter-dependent
 * methods dereference `this.painter` unguarded, exactly like the engine, so on
 * a map whose GPU init was refused they throw the production messages this
 * suite keeps seeing in the hub bug tracker.
 */
function fakeMap({ painter }: { painter?: unknown }) {
  return {
    painter,
    removed: false,
    resizeCalls: 0,
    markers: 0,
    _resizeInternal() {
      // Deliberately unguarded, mirroring the engine.
      (this.painter as { resize: () => void }).resize();
    },
    resize() {
      this.resizeCalls += 1;
      this._resizeInternal();
    },
    addMarker() {
      this.markers += 1;
      // Marker.addTo -> _update -> project, which walks the painter transform.
      return (this.painter as { transform: number[] }).transform[0];
    },
    remove() {
      // maplibre walks the painter to free GL resources, so teardown of a
      // half-built map throws too.
      (this.painter as { destroy: () => void }).destroy();
      this.removed = true;
    },
  };
}

type FakeMap = ReturnType<typeof fakeMap>;

const healthyPainter = () => ({ resize: vi.fn(), transform: [0, 0], destroy: vi.fn() });

/**
 * The `requestAnimationFrame` callback exactly as MapboxMini wires it. This is
 * the mini-map's late-callback surface: it runs a frame after the promise chain
 * has exited, so anything it throws is uncaught.
 */
function rafResize(read: () => FakeMap | null, cancelled: boolean) {
  return () => {
    const map = read();
    if (cancelled || !map || !isMapUsable(map)) return 'skipped';
    map.resize();
    return 'resized';
  };
}

/** The effect cleanup exactly as MapboxMini writes it. */
function teardown(map: FakeMap | null) {
  try {
    map?.remove();
  } catch (err) {
    return `warned: ${String(err)}`;
  }
  return 'removed';
}

beforeEach(() => {
  __resetWebglProbeForTest();
  probe.mockReset();
  probe.mockReturnValue(true);
});

describe('MapStartupUnsupportedError', () => {
  it('is a distinguishable Error subclass', () => {
    const unsupported = new MapStartupUnsupportedError();
    expect(unsupported).toBeInstanceOf(Error);
    expect(unsupported.name).toBe('MapStartupUnsupportedError');
    expect(unsupported.message).toBe('WebGL2 is unavailable');
    // So a caller can warn for this and still report everything else.
    expect(new Error('WebGL2 is unavailable')).not.toBeInstanceOf(MapStartupUnsupportedError);
  });
});

describe('webglSupported', () => {
  it('reports what the shared WebGL2 probe says', () => {
    probe.mockReturnValue(false);
    expect(webglSupported()).toBe(false);
    __resetWebglProbeForTest();
    probe.mockReturnValue(true);
    expect(webglSupported()).toBe(true);
  });

  it('probes once and reuses the answer across the reporter widgets', () => {
    expect(webglSupported()).toBe(true);
    expect(webglSupported()).toBe(true);
    expect(webglSupported()).toBe(true);
    expect(probe).toHaveBeenCalledTimes(1);
  });
});

describe('isMapUsable', () => {
  it('rejects the half-built map MapLibre v6 returns when GPU init fails', () => {
    expect(isMapUsable(fakeMap({ painter: undefined }))).toBe(false);
  });

  it('accepts a fully constructed map', () => {
    expect(isMapUsable(fakeMap({ painter: healthyPainter() }))).toBe(true);
  });

  it('is null-safe', () => {
    expect(isMapUsable(null)).toBe(false);
    expect(isMapUsable(undefined)).toBe(false);
  });
});

describe('a half-built map really is dangerous (non-vacuity)', () => {
  // If these ever stop throwing, every "does not throw" below passes for free
  // and this file protects nothing.
  it('detonates on resize(), inside _resizeInternal', () => {
    expect(() => fakeMap({ painter: undefined }).resize()).toThrow(
      /Cannot read properties of undefined \(reading 'resize'\)/,
    );
  });

  it('detonates on Marker.addTo', () => {
    expect(() => fakeMap({ painter: undefined }).addMarker()).toThrow(/reading 'transform'/);
  });

  it('detonates on teardown remove()', () => {
    expect(() => fakeMap({ painter: undefined }).remove()).toThrow(/reading 'destroy'/);
  });

  it('is exactly what a try/catch around the constructor cannot catch', () => {
    // The shape of the useless guard: v6 returns the broken map instead of
    // throwing out of the constructor, so the catch block is unreachable.
    const construct = () => fakeMap({ painter: undefined });
    let caught = false;
    let built: FakeMap | null = null;
    try {
      built = construct();
    } catch {
      caught = true;
    }
    expect(caught).toBe(false);
    expect(isMapUsable(built)).toBe(false);
  });
});

describe('the painter gate keeps the half-built map out of MapboxMini', () => {
  it('drops it instead of handing it to the load/idle callbacks', () => {
    let map: FakeMap | null = fakeMap({ painter: undefined });
    let handedToCallbacks: FakeMap | null = null;
    if (!isMapUsable(map)) {
      expect(teardown(map)).toMatch(/^warned:/); // best-effort, must not throw
      map = null;
    } else {
      handedToCallbacks = map;
    }
    expect(map).toBeNull();
    expect(handedToCallbacks).toBeNull();
  });

  it('still lets a healthy map through', () => {
    const map: FakeMap | null = fakeMap({ painter: healthyPainter() });
    let handedToCallbacks: FakeMap | null = null;
    if (isMapUsable(map)) handedToCallbacks = map;
    expect(handedToCallbacks).toBe(map);
  });
});

describe('the rAF resize degrades instead of crashing', () => {
  it('does not resize a half-built map', () => {
    const map = fakeMap({ painter: undefined });
    const fire = rafResize(() => map, false);
    expect(fire).not.toThrow();
    expect(fire()).toBe('skipped');
    expect(map.resizeCalls).toBe(0);
  });

  it('does not resize after the effect was cancelled', () => {
    const map = fakeMap({ painter: healthyPainter() });
    const fire = rafResize(() => map, true);
    expect(fire()).toBe('skipped');
    expect(map.resizeCalls).toBe(0);
  });

  it('does not resize a map the gate already dropped to null', () => {
    const fire = rafResize(() => null, false);
    expect(fire).not.toThrow();
    expect(fire()).toBe('skipped');
  });

  it('does not resize a map whose painter was freed by remove()', () => {
    // StrictMode double-invoke: the frame still holds this instance, but its
    // GL resources are gone.
    const map = fakeMap({ painter: healthyPainter() });
    map.painter = undefined;
    const fire = rafResize(() => map, false);
    expect(fire).not.toThrow();
    expect(map.resizeCalls).toBe(0);
  });

  it('still resizes a healthy, mounted map', () => {
    const map = fakeMap({ painter: healthyPainter() });
    expect(rafResize(() => map, false)()).toBe('resized');
    expect(map.resizeCalls).toBe(1);
  });
});

describe('teardown of a half-built map never throws', () => {
  it('survives it the way the effect cleanup does', () => {
    const map = fakeMap({ painter: undefined });
    expect(() => teardown(map)).not.toThrow();
    expect(teardown(map)).toMatch(/reading 'destroy'/);
  });

  it('is a no-op when no map was ever built', () => {
    expect(teardown(null)).toBe('removed');
  });

  it('still tears down a healthy map', () => {
    const map = fakeMap({ painter: healthyPainter() });
    expect(teardown(map)).toBe('removed');
    expect(map.removed).toBe(true);
  });
});

// Source pins: the runtime behavior above is only reached if the components are
// actually wired this way. These fail loudly if a future edit drops a guard.
describe('MapboxMini.tsx wiring', () => {
  it('preflights WebGL2 before constructing the map', () => {
    expect(miniSource).toContain("from '../../lib/mapStartup'");
    expect(miniSource).toContain('if (!webglSupported()) {');
    // The preflight must come before the constructor, or it guards nothing.
    expect(at(miniSource, 'MapboxMini.tsx', 'if (!webglSupported()) {')).toBeLessThan(
      at(miniSource, 'MapboxMini.tsx', 'new maplibregl.Map({'),
    );
  });

  it('gates on the painter before the instance is used', () => {
    expect(miniSource).toContain('if (!isMapUsable(map)) {');
    const gate = at(miniSource, 'MapboxMini.tsx', 'if (!isMapUsable(map)) {');
    // Storing a half-built map is what poisons every later callback.
    expect(gate).toBeGreaterThan(at(miniSource, 'MapboxMini.tsx', 'new maplibregl.Map({'));
    expect(gate).toBeLessThan(at(miniSource, 'MapboxMini.tsx', 'const m = map;'));
    // The dropped instance must not be left for the cleanup to remove again.
    expect(miniSource).toContain('map = null;');
  });

  it('re-checks the map inside the rAF resize callback', () => {
    expect(miniSource).toContain('if (cancelled || !map || !isMapUsable(map)) return;');
    // The bare form is the bug: it captures the map and never re-checks it.
    expect(miniSource).not.toContain('requestAnimationFrame(() => m.resize());');
  });

  it('wraps teardown remove() in try/catch', () => {
    expect(miniSource).toMatch(/try \{\s*\n\s*map\?\.remove\(\);\s*\n\s*\} catch/);
    // The bare form is the bug.
    expect(miniSource).not.toMatch(/\n {6}map\?\.remove\(\);/);
  });

  it('renders the shared fallback instead of an empty box', () => {
    expect(miniSource).toContain("from '@aireon/shared/webgl'");
    expect(miniSource).toContain('<MapUnavailable dark />');
  });

  it('warns rather than files a bug row for a WebGL2-less visitor', () => {
    // main.tsx installs the shared error logger with captureConsoleErrors, so a
    // console.error here would post one hub bug row per WebGL2-less visit. An
    // absent GPU is an environment condition, not a showroom defect.
    expect(miniSource).toContain("console.warn('MapLibre startup unsupported:'");
    expect(miniSource).toContain('MapStartupUnsupportedError');
    // Every map-startup / teardown log is a warn, never an error.
    const startupLogs = miniSource.match(/console\.(warn|error)\('MapLibre[^']*'/g) ?? [];
    expect(startupLogs.length, 'no MapLibre startup logging found at all').toBeGreaterThanOrEqual(3);
    expect(startupLogs.filter((line) => line.startsWith('console.error'))).toEqual([]);
  });
});

describe.each([
  ['RoofsWidget.tsx', roofsSource],
  ['ValooWidget.tsx', valooSource],
])('%s wiring', (label, source) => {
  it('routes a WebGL2-less device to the existing unavailable card', () => {
    expect(source).toContain("from '../../../lib/mapStartup'");
    expect(source).toContain('if (!mapboxConfigured || !webglSupported()) {');
    // The bare form is the bug: it only covered a missing Mapbox token, so a
    // WebGL2-less device mounted the map anyway.
    expect(source).not.toContain('if (!mapboxConfigured) {');
    // ...and it must short-circuit BEFORE the map component is rendered.
    expect(at(source, label, 'if (!mapboxConfigured || !webglSupported()) {')).toBeLessThan(
      at(source, label, '<MapboxMini'),
    );
  });

  it('tells the two causes apart in the card copy', () => {
    expect(source).toContain('page.reporter.widget.webgl_missing');
    expect(source).toContain('page.reporter.widget.mapbox_missing');
  });
});
