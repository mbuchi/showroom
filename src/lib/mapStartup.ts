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
 * caught — by `constructMapSafely` at the constructor and by
 * {@link isMapUsable} in every late callback, never by this.
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
 * ⚠ How MapLibre v6 reports a refused WebGL2 context CHANGED mid-major, and the
 * two behaviors are mutually exclusive, so a guard written for one is dead code
 * under the other:
 *
 *   <= 6.6.0  `_setupPainter` fires a `GPUInitializationError` EVENT and the
 *             constructor runs `this._setupPainter(); if (!this.painter) return;`
 *             — it bails before the style, the handlers and the event wiring
 *             exist and hands back a `Map` that LOOKS constructed. A
 *             `try/catch` around the constructor never fires.
 *   >= 6.7.0  `_setupPainter` THROWS and the constructor rethrows after
 *             `_cleanupContainer()` — so there is no instance at all, and a
 *             post-construction painter check is never reached.
 *
 * Stored in a ref, the <= 6.6.0 half-built instance detonates somewhere
 * unrelated (observed on maplibre-gl 6.3.0):
 *
 *   - `resize()` -> `_resizeInternal` -> `this.painter.resize(...)`
 *     => `Cannot read properties of undefined (reading 'resize')`
 *   - `Marker.addTo` / `easeTo` / `project` => `...(reading '0')`
 *   - the unmount's `remove()` -> `this.painter.destroy()`
 *     => `...(reading 'destroy')`
 *
 * One environment condition, three unrelated-looking bug rows. So CONSTRUCTION
 * goes through `constructMapSafely` from `@aireon/shared/webgl`, which covers
 * both engines in one place and rethrows anything that is not a GPU-init
 * failure.
 *
 * This predicate is still load-bearing as the MID-SESSION guard: MapLibre also
 * clears the painter when the GL context dies after a healthy boot, so every
 * late callback (the mini-map's rAF resize) must re-check rather than trust the
 * instance it captured.
 *
 * Suite memory: maplibre-6-7-0-throws-on-gpu-init,
 * maplibre-gpu-init-returns-half-built-map.
 */
export function isMapUsable(map: unknown): boolean {
  return (map as { painter?: unknown } | null | undefined)?.painter !== undefined;
}
