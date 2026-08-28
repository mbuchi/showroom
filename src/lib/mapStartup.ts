import { isWebGLAvailable } from '@aireon/shared/webgl';

/**
 * The one map-startup failure that belongs to the VISITOR'S BROWSER rather than
 * to showroom: no usable WebGL2 context, so MapLibre can never paint on this
 * device. The reporter's mini-maps route it to the same "widget unavailable"
 * card any other startup failure ends in, but the caller logs it with
 * `console.warn` instead of `console.error`, because `main.tsx` installs the
 * shared error logger with `captureConsoleErrors: true` — a `console.error`
 * here would file one hub bug row per WebGL2-less visit.
 *
 * Same convention as doorway (`src/lib/mapStartup.ts`), hexoo and hood.
 */
export class MapStartupUnsupportedError extends Error {
  constructor(message = 'WebGL2 is unavailable') {
    super(message);
    this.name = 'MapStartupUnsupportedError';
  }
}

/**
 * Cached WebGL2 preflight. The shared probe builds a throwaway <canvas> and
 * asks for a `webgl2` context; the answer cannot change for the life of the
 * document in any way that matters here, and the reporter renders several
 * map widgets, so probe once and reuse.
 *
 * ⚠ The cache is the reason a LATER loss of the GPU process still has to be
 * caught — by {@link isMapUsable} after construction, never by this.
 */
let webglProbe: boolean | undefined;

export function webglSupported(): boolean {
  if (webglProbe === undefined) webglProbe = isWebGLAvailable();
  return webglProbe;
}

/** Exported for tests only — drops the memoized probe result. */
export function __resetWebglProbeForTest(): void {
  webglProbe = undefined;
}

/**
 * Is this MapLibre instance usable?
 *
 * ⚠ MapLibre v6 never THROWS when the WebGL2 context cannot be created. Its
 * constructor runs `this._setupPainter(); if (!this.painter) return;` — the
 * painter setup fires a `GPUInitializationError` at the half-built map and
 * returns, so the constructor bails before the style, the handlers and the
 * event wiring exist, and hands back a `Map` that LOOKS constructed. Stored in
 * a ref it then detonates somewhere unrelated (maplibre-gl 6.3.0):
 *
 *   - `resize()` -> `_resizeInternal` -> `this.painter.resize(...)`
 *     => `Cannot read properties of undefined (reading 'resize')`
 *   - `Marker.addTo` / `easeTo` / `project` => `...(reading '0')`
 *   - the unmount's `remove()` -> `this.painter.destroy()`
 *     => `...(reading 'destroy')`
 *
 * One environment condition, three unrelated-looking bug rows. A `try/catch`
 * around the constructor cannot see any of it — the catch never runs. Gate on
 * the painter instead of trusting the constructor.
 */
export function isMapUsable(map: unknown): boolean {
  return (map as { painter?: unknown } | null | undefined)?.painter !== undefined;
}
