// The MapLibre startup contract for the reporter's mini-maps.
//
// ⚠ MapLibre v6 has TWO mutually exclusive ways of reporting a refused WebGL2
// context, and the engine switched between them inside the same major:
//
//   <= 6.6.0  `_setupPainter` fires a `GPUInitializationError` EVENT; the
//             constructor runs `this._setupPainter(); if (!this.painter) return;`
//             and RESOLVES, handing back a `Map` that looks constructed but has
//             no painter, no style and no handlers. A
//             `try { new maplibregl.Map(...) } catch {}` is UNREACHABLE here.
//   >= 6.7.0  `_setupPainter` THROWS; the constructor does
//             `try { this._setupPainter() } catch (e) { this._cleanupContainer(); throw e }`
//             and THROWS, so there is no instance at all and every
//             post-construction painter gate is DEAD CODE.
//
// The <= 6.6.0 half-built instance detonates somewhere unrelated:
//
//   - `resize()` -> `_resizeInternal` -> `this.painter.resize(...)`
//     => `Cannot read properties of undefined (reading 'resize')`
//   - `Marker.addTo` -> project through the painter transform => `...'0'`
//   - the cleanup's `remove()` -> `this.painter.destroy()` => `...'destroy'`
//
// The >= 6.7.0 throw is worse in a different way HERE: MapboxMini builds its map
// inside a `.then()`, so the throw rejects the chain and lands in the `.catch`,
// whose `console.error` main.tsx turns into one hub bug row per affected visitor
// (`errorLogger.install({ captureConsoleErrors: true })`, no beforeCapture veto
// in src/lib/errorLog.ts) — while the card just sat on its skeleton.
//
// So construction goes through `constructMapSafely` from `@aireon/shared/webgl`,
// which folds BOTH behaviors into a `null` return and rethrows anything that is
// not a GPU-init failure. This file pins the contract that actually holds —
// preflight, one guarded construction, a re-checking rAF callback, safe teardown,
// and warn-never-error for a device condition — against a fake engine that
// reproduces both real failures, so it fails when the BEHAVIOR regresses and not
// merely when wording moves. The source pins at the bottom keep the components
// wired to that behavior.
//
// Suite memory: maplibre-6-7-0-throws-on-gpu-init,
// maplibre-gpu-init-returns-half-built-map (hexoo #129, doorway #225, hood #280,
// choose #263).

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ⚠ Only `isWebGLAvailable` is faked (mapStartup's memoized probe needs a
// controllable answer). Everything else — including `constructMapSafely`, the
// helper under test below — comes from the REAL @aireon/shared/webgl, so these
// cases exercise the shipped implementation rather than a restatement of it.
const probe = vi.fn(() => true);
vi.mock('@aireon/shared/webgl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@aireon/shared/webgl')>();
  return { ...actual, isWebGLAvailable: () => probe(), MapUnavailable: () => null };
});

import { constructMapSafely, isGpuInitializationError, safeRemoveMap } from '@aireon/shared/webgl';
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
 * A stand-in for the <= 6.6.0 failure mode: the painter-dependent methods
 * dereference `this.painter` unguarded, exactly like the engine, so on a map
 * whose GPU init was refused they throw the production messages this suite kept
 * seeing in the hub bug tracker. Still the right model for a map whose context
 * dies AFTER a healthy boot, which happens on every engine.
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
 * The >= 6.7.0 failure mode: the engine throws out of the constructor, having
 * already run `_cleanupContainer()`, so there is no instance to hand back.
 *
 * ⚠ Recognized by NAME, never by `instanceof` — the suite loads the engine from
 * static.aireon.ch through an import map, so the class an app catches need not
 * be the one any bundled copy exposes.
 */
function gpuInitError(): Error {
  const error = new Error(
    'WebGL2 is required to display this map, but it is not supported by your browser.',
  );
  error.name = 'GPUInitializationError';
  return error;
}

/** The construction branch exactly as MapboxMini writes it. */
function buildMini(construct: () => FakeMap) {
  const warns: string[] = [];
  const errors: string[] = [];
  let unavailable = false;
  let handedToCallbacks: FakeMap | null = null;

  let map: FakeMap | null = null;
  try {
    map = constructMapSafely(construct);
    if (!map) {
      warns.push('MapLibre startup unsupported');
      unavailable = true;
    } else {
      handedToCallbacks = map;
    }
  } catch (error) {
    // The `.catch` on the promise chain.
    if (isGpuInitializationError(error)) {
      warns.push('MapLibre startup unsupported');
      unavailable = true;
    } else {
      errors.push(`Unable to load the reporter mini-map style for MapLibre: ${String(error)}`);
    }
  }

  return { map, unavailable, handedToCallbacks, warns, errors };
}

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

/**
 * The effect cleanup exactly as MapboxMini writes it: the shared best-effort
 * remove. `true` = `remove()` completed, `false` = there was nothing to remove
 * or it threw (which the unmount path must survive either way).
 */
function teardown(map: FakeMap | null) {
  return safeRemoveMap(map);
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

  it('is exactly what a try/catch around the constructor cannot catch on <= 6.6.0', () => {
    // Why the painter gate exists at all: this engine RESOLVES with the broken
    // map instead of throwing, so a bare catch block never runs.
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

describe('a >= 6.7.0 constructor really does throw (non-vacuity)', () => {
  // The mirror image of the block above, and the reason the painter gate alone
  // stopped being enough. If this ever stops throwing, every case below that
  // proves the throw is absorbed passes for free.
  it('throws out of the constructor instead of returning a broken map', () => {
    let caught: unknown = null;
    let built: FakeMap | null = null;
    try {
      built = ((): FakeMap => {
        throw gpuInitError();
      })();
    } catch (error) {
      caught = error;
    }
    expect(built).toBeNull();
    expect(caught).not.toBeNull();
    expect((caught as Error).name).toBe('GPUInitializationError');
    // ...and the painter gate written for 6.6.0 is never reached by it.
    expect(isGpuInitializationError(caught)).toBe(true);
  });
});

describe('constructMapSafely folds both engine behaviors into one null', () => {
  it('absorbs the >= 6.7.0 throw', () => {
    const built = buildMini(() => {
      throw gpuInitError();
    });
    expect(built.map).toBeNull();
    expect(built.handedToCallbacks).toBeNull();
    // The graceful path: the fallback panel renders and nothing is logged as an
    // error, so no hub bug row is filed for a device setting.
    expect(built.unavailable).toBe(true);
    expect(built.warns).toEqual(['MapLibre startup unsupported']);
    expect(built.errors).toEqual([]);
  });

  it('absorbs the <= 6.6.0 painter-less instance', () => {
    const built = buildMini(() => fakeMap({ painter: undefined }));
    expect(built.map).toBeNull();
    expect(built.handedToCallbacks).toBeNull();
    expect(built.unavailable).toBe(true);
    expect(built.warns).toEqual(['MapLibre startup unsupported']);
    expect(built.errors).toEqual([]);
  });

  it('does NOT launder an unrelated constructor failure into "no WebGL here"', () => {
    // A missing container, a malformed style, a genuine bug: these must stay
    // loud and keep reaching the app's existing error path, or a real defect
    // disappears behind a fallback panel nobody reports.
    const built = buildMini(() => {
      throw new TypeError("Cannot read properties of null (reading 'appendChild')");
    });
    expect(built.map).toBeNull();
    expect(built.unavailable).toBe(false);
    expect(built.warns).toEqual([]);
    expect(built.errors).toEqual([
      "Unable to load the reporter mini-map style for MapLibre: TypeError: Cannot read properties of null (reading 'appendChild')",
    ]);
  });

  it('still lets a healthy map through to the load/idle callbacks', () => {
    const built = buildMini(() => fakeMap({ painter: healthyPainter() }));
    expect(built.map).not.toBeNull();
    expect(built.handedToCallbacks).toBe(built.map);
    expect(built.unavailable).toBe(false);
    expect(built.warns).toEqual([]);
    expect(built.errors).toEqual([]);
  });

  it('releases the half-built instance rather than leaking its container', () => {
    // remove() throws on a painter-less map, so the helper has to swallow that
    // too — the whole point of routing teardown through safeRemoveMap.
    const map = fakeMap({ painter: undefined });
    expect(() => constructMapSafely(() => map)).not.toThrow();
    expect(map.removed).toBe(false); // remove() threw, and that was survivable
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

describe('teardown of a painter-less map never throws', () => {
  it('survives it the way the effect cleanup does', () => {
    // remove() walks the painter, so this is the `...reading 'destroy'` throw.
    // A throw on the unmount path would take the React tree with it.
    const map = fakeMap({ painter: undefined });
    expect(() => teardown(map)).not.toThrow();
    expect(teardown(map)).toBe(false);
    expect(map.removed).toBe(false);
  });

  it('is a no-op when no map was ever built', () => {
    expect(() => teardown(null)).not.toThrow();
    expect(teardown(null)).toBe(false);
  });

  it('still tears down a healthy map', () => {
    const map = fakeMap({ painter: healthyPainter() });
    expect(teardown(map)).toBe(true);
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

  it('routes EVERY construction through the shared two-behavior guard', () => {
    expect(miniSource).toContain("from '@aireon/shared/webgl'");
    expect(miniSource).toContain('constructMapSafely(() => new maplibregl.Map({');
    // ⚠ Not just "a guarded one exists" — no BARE constructor may creep back
    // in beside it. A bare `new maplibregl.Map(...)` is the bug on both
    // engines: <= 6.6.0 hands back a painter-less map, >= 6.7.0 throws past
    // every post-construction gate straight into the promise `.catch`.
    const constructions = miniSource.match(/new maplibregl\.Map\(\{/g) ?? [];
    expect(constructions.length, 'no map construction found at all').toBe(1);
    const guarded = miniSource.match(/constructMapSafely\(\(\) => new maplibregl\.Map\(\{/g) ?? [];
    expect(guarded.length).toBe(constructions.length);
  });

  it('gates on the guard result before the instance is used', () => {
    // Same contract the retired `if (!isMapUsable(map)) {` pin protected: the
    // gate sits between the constructor and the first use of the instance, so
    // an unusable map never reaches the load/idle callbacks or the ref.
    expect(miniSource).toContain('if (!map) {');
    const gate = at(miniSource, 'MapboxMini.tsx', 'if (!map) {');
    expect(gate).toBeGreaterThan(at(miniSource, 'MapboxMini.tsx', 'new maplibregl.Map({'));
    expect(gate).toBeLessThan(at(miniSource, 'MapboxMini.tsx', 'const m = map;'));
    // ...and the failure renders the fallback rather than an empty container.
    expect(gate).toBeLessThan(at(miniSource, 'MapboxMini.tsx', 'setUnavailable(true)'));
    expect(miniSource).toContain('if (!webgl || unavailable) {');
  });

  it('re-checks the map inside the rAF resize callback', () => {
    // Still load-bearing on every engine: the GL context can die AFTER a
    // healthy boot, and MapLibre clears the painter when it does.
    expect(miniSource).toContain('if (cancelled || !map || !isMapUsable(map)) return;');
    // The bare form is the bug: it captures the map and never re-checks it.
    expect(miniSource).not.toContain('requestAnimationFrame(() => m.resize());');
  });

  it('tears down through the shared best-effort remove', () => {
    expect(miniSource).toContain('safeRemoveMap(map)');
    // The bare forms are the bug: remove() walks the painter, so it throws on a
    // context-lost map and a throw on the unmount path takes the tree with it.
    expect(miniSource).not.toMatch(/\n {6}map\?\.remove\(\);/);
    expect(miniSource).not.toMatch(/\bmap\??\.remove\(\)/);
  });

  it('renders the shared fallback instead of an empty box', () => {
    expect(miniSource).toContain("from '@aireon/shared/webgl'");
    expect(miniSource).toContain('<MapUnavailable dark />');
  });

  it('warns rather than files a bug row for a WebGL2-less visitor', () => {
    // main.tsx installs the shared error logger with captureConsoleErrors and
    // src/lib/errorLog.ts carries no beforeCapture veto, so a console.error on
    // a startup path posts one hub bug row per affected visitor. An absent or
    // refused GPU is an environment condition, not a showroom defect.
    expect(miniSource).toContain("console.warn('MapLibre startup unsupported:'");
    expect(miniSource).toContain('MapStartupUnsupportedError');
    // All three startup surfaces warn: the preflight, the construction guard,
    // and the promise catch a GPU-init throw would land in.
    const startupWarns = miniSource.match(/console\.warn\('MapLibre startup unsupported:'/g) ?? [];
    expect(startupWarns.length, 'a startup surface stopped warning').toBe(3);
    // ⚠ Census over EVERY console.error in the file, not only literals starting
    // with 'MapLibre'. The old regex (/console\.(warn|error)\('MapLibre[^']*'/)
    // was structurally blind to
    // `console.error('Unable to load the reporter mini-map style for MapLibre', error)`
    // — the exact line a 6.7.0 GPU-init throw lands on — and reported a clean
    // bill of health for it.
    const errors = miniSource.match(/console\.error\(/g) ?? [];
    expect(errors.length, 'a new console.error appeared on a startup path').toBe(1);
    // The one that remains is for genuine style/network failures only: it is
    // reachable solely after the GPU-init test has ruled a device condition out.
    expect(at(miniSource, 'MapboxMini.tsx', 'if (isGpuInitializationError(error)) {')).toBeLessThan(
      at(miniSource, 'MapboxMini.tsx', 'console.error('),
    );
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
