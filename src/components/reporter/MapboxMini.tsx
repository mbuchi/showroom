import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { StyleSpecification } from 'maplibre-gl';
import { loadMapboxStyleForMapLibre } from '@aireon/shared';
import { applyMapWorkerUrl } from '@aireon/shared/map-worker';
import {
  MapUnavailable,
  constructMapSafely,
  isGpuInitializationError,
  safeRemoveMap,
} from '@aireon/shared/webgl';
import { MapStartupUnsupportedError, isMapUsable, webglSupported } from '../../lib/mapStartup';

// A small, non-interactive MapLibre GL map for the Valoo and Roofs widgets,
// keeping the same Mapbox-hosted basemap styles. `interactive: false` disables
// all drag/zoom/rotate at once — the card is a fixed report snapshot, not an
// explorable map.

// MapLibre v6 is ESM-only and starts its tile worker as a module Worker whose
// URL it derives from its own `import.meta.url`. Once a bundler has rewritten
// the engine into an app chunk that derivation yields nothing usable: the
// worker never starts, no vector tile is parsed, and the canvas paints blank.
// This points the module we construct from at the worker asset the build
// actually emitted. The call is idempotent and must run before the first
// `new maplibregl.Map(...)`, so it sits at module scope.
//
// Both imports are STATIC on purpose and are still off the first-load path:
// this file is only reachable through the lazy `/reporter` route (App.tsx
// `lazy(() => import('./components/reporter/ReporterView'))`), so MapLibre and
// this seam share that route's chunk. Do NOT lift either import into an eager
// module — that would drag the whole engine back into the initial bundle.
applyMapWorkerUrl(maplibregl);

const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined) ?? '';

export const mapboxConfigured = Boolean(MAPBOX_TOKEN);

interface MapboxMiniProps {
  lat: number;
  lng: number;
  zoom?: number;
  pitch?: number;
  styleUrl: string;
  /** Called once on map 'load' — add sources/layers here. */
  onLoad: (map: maplibregl.Map) => void;
  /** Called after the map first goes 'idle' — read rendered features here. */
  onIdle?: (map: maplibregl.Map) => void;
}

export default function MapboxMini({
  lat,
  lng,
  zoom = 17,
  pitch = 0,
  styleUrl,
  onLoad,
  onIdle,
}: MapboxMiniProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onLoadRef = useRef(onLoad);
  const onIdleRef = useRef(onIdle);
  onLoadRef.current = onLoad;
  onIdleRef.current = onIdle;

  const webgl = webglSupported();

  // Set when the map could not be BUILT on this device — the case the preflight
  // above structurally cannot see, because it is memoized for the life of the
  // document and the style is fetched over the network in between. Without this
  // flag a refused context left the component rendering an empty container and
  // the card sat on its loading skeleton until useReporterWidget's 25s timeout
  // flipped it to a bare 'error'.
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !mapboxConfigured) return;

    // A new position/style is a fresh attempt: clear a previous device refusal
    // so the container gets a chance to mount again.
    setUnavailable(false);

    // WebGL2 preflight (@aireon/shared/webgl, suite standard). MapLibre v6
    // dropped the WebGL1 renderer, so a client without a WebGL2 context can
    // never paint here. How the engine REPORTS that changed mid-v6 and the two
    // behaviors are mutually exclusive, so neither guard alone is enough:
    //
    //   <= 6.6.0  `_setupPainter` fires a GPUInitializationError EVENT and the
    //             constructor returns a painter-less Map that looks built
    //   >= 6.7.0  `_setupPainter` THROWS and the constructor rethrows after
    //             `_cleanupContainer()`, so there is no instance at all
    //
    // Preflighting here keeps both out of the common case; `constructMapSafely`
    // below covers the window this probe cannot. The render at the bottom shows
    // <MapUnavailable/> instead.
    if (!webglSupported()) {
      // An absent WebGL2 context is a property of the visitor's device, not a
      // showroom defect. console.warn (not console.error) because main.tsx
      // installs the shared error logger with captureConsoleErrors, which would
      // otherwise file one hub bug row per WebGL2-less visit.
      console.warn('MapLibre startup unsupported:', new MapStartupUnsupportedError().message);
      return;
    }

    const container = containerRef.current;

    let cancelled = false;
    let map: maplibregl.Map | null = null;
    let raf = 0;

    // MapLibre can't consume `mapbox://` styles directly, so resolve the Mapbox
    // style document (mapbox:// → https + token) before creating the map.
    void loadMapboxStyleForMapLibre(styleUrl, { token: MAPBOX_TOKEN })
      .then((style) => {
        if (cancelled) return;

        // Second gate, for the window the preflight cannot cover: the style is
        // resolved over the network first, so the context can still be refused
        // between the probe and this constructor (a tab that lost its GPU
        // process, or a client already at the browser's WebGL context limit —
        // the reporter mounts several of these mini-maps at once, each with its
        // own map, so that limit is realistically reachable here).
        //
        // ⚠ Must be `constructMapSafely`, not a bare constructor plus a painter
        // check. The painter check alone is DEAD CODE on maplibre-gl >= 6.7.0:
        // the engine throws out of the constructor, the throw sails past every
        // post-construction gate, rejects this promise chain and lands in the
        // `.catch` below. A bare try/catch alone is dead code on <= 6.6.0 for
        // the same reason inverted. The shared helper folds both into one
        // `null` and RETHROWS anything that is not a GPU-init failure, so a bad
        // style or a real bug still reaches the `.catch` and stays loud.
        map = constructMapSafely(() => new maplibregl.Map({
          container,
          style: style as unknown as StyleSpecification,
          center: [lng, lat],
          zoom,
          pitch,
          interactive: false,
          // Attribution suppressed here — credits (swisstopo / MapLibre GL) are
          // surfaced in the About modal (account menu → About this app) per the
          // suite-standard pattern adopted in this app (matching roofs/roots etc.).
          attributionControl: false,
          // Needed for `map.getCanvas().toDataURL()` and html-to-image to capture
          // the WebGL canvas for the PDF report — without this WebGL clears the
          // back buffer between frames and the snapshot comes out blank. In
          // MapLibre v5 this WebGL flag lives under `canvasContextAttributes`
          // (Mapbox GL exposed it as a top-level `preserveDrawingBuffer`).
          canvasContextAttributes: { preserveDrawingBuffer: true },
        }));

        // null = this device cannot paint a map. The helper already released
        // whatever half-built instance a <= 6.6.0 engine handed back, so there
        // is nothing left to remove and `map` is already null for the cleanup.
        if (!map) {
          console.warn('MapLibre startup unsupported:', new MapStartupUnsupportedError().message);
          if (!cancelled) setUnavailable(true);
          return;
        }

        const m = map;

        let idleFired = false;
        const handleIdle = () => {
          if (idleFired) return;
          idleFired = true;
          onIdleRef.current?.(m);
        };

        m.on('load', () => {
          onLoadRef.current(m);
          new maplibregl.Marker({ color: '#22d3ee' }).setLngLat([lng, lat]).addTo(m);
          m.on('idle', handleIdle);
        });

        // Defensive re-measure on the next frame, mirroring LeafletMini — the
        // container can still be settling inside the aspect-ratio card on first
        // paint.
        //
        // ⚠ The callback must RE-CHECK the map, not just capture it. It runs a
        // frame later, outside the promise chain, so anything it throws is an
        // uncaught runtime error no ErrorBoundary sees. Two ways the map is
        // gone by then: the cleanup already ran `remove()` (React 18 StrictMode
        // double-invokes this effect, and a retry remounts the card), or the GL
        // context died in between and MapLibre cleared the painter — either way
        // `resize()` dies inside `_resizeInternal` on
        // `...undefined (reading 'resize')`. This is the MID-SESSION guard, and
        // it stays load-bearing on every engine: `constructMapSafely` above only
        // vouches for the instant of construction.
        raf = requestAnimationFrame(() => {
          if (cancelled || !map || !isMapUsable(map)) return;
          map.resize();
        });
      })
      .catch((error) => {
        // ⚠ A refused GPU is a property of the visitor's device, never a
        // showroom defect, and it must not arrive here as an error. main.tsx
        // installs the shared error logger with `captureConsoleErrors: true`
        // and errorLog.ts carries no beforeCapture veto, so every console.error
        // on this line files one hub bug row per affected visitor.
        // `constructMapSafely` already absorbs the refusal at the constructor
        // on both engines; this is the backstop for any other GPU-init failure
        // the chain could surface, so the classification lives on both paths.
        if (isGpuInitializationError(error)) {
          console.warn('MapLibre startup unsupported:', new MapStartupUnsupportedError().message);
          if (!cancelled) setUnavailable(true);
          return;
        }
        // Everything else IS a real failure (a broken style document, a dead
        // Mapbox token, a network fault) and stays loud.
        console.error('Unable to load the reporter mini-map style for MapLibre', error);
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      // `remove()` walks the painter to free GL resources, so it throws
      // ("...reading 'destroy'") on a map whose GL context died after a healthy
      // boot. Teardown must not be the thing that files the bug row, so it goes
      // through the shared best-effort helper.
      safeRemoveMap(map);
    };
  }, [lat, lng, zoom, pitch, styleUrl]);

  // No usable WebGL2 — either the preflight said so up front, or the map could
  // not be constructed once the style had loaded. Show the shared fallback
  // panel rather than an empty box. In practice the reporter widgets
  // short-circuit to their own "unavailable" card before mounting this
  // component; this keeps MapboxMini honest on its own for any other caller.
  if (!webgl || unavailable) {
    return (
      <div className="reporter-mini-map absolute inset-0 isolate">
        <MapUnavailable dark />
      </div>
    );
  }

  // Two divs on purpose: Mapbox adds the `.mapboxgl-map` class (which forces
  // `position: relative`) to whatever element it is given. If that element
  // also carried Tailwind's `absolute inset-0`, Mapbox's rule would override
  // `position` and `inset-0` would stop sizing it — collapsing the map to
  // height 0. So the OUTER div owns `absolute inset-0`, and the INNER div —
  // the actual Mapbox container — is sized by `h-full w-full`, which works
  // regardless of its `position`.
  // `isolate` keeps Mapbox's own controls in their own stacking context;
  // `reporter-mini-map` is the hook for the CSS that lifts the required
  // Mapbox logo out of the headline-value scrim (see index.css).
  return (
    <div className="reporter-mini-map absolute inset-0 isolate">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
