import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { StyleSpecification } from 'maplibre-gl';
import { loadMapboxStyleForMapLibre } from '@aireon/shared';

// A small, non-interactive MapLibre GL map for the Valoo and Roofs widgets,
// keeping the same Mapbox-hosted basemap styles. `interactive: false` disables
// all drag/zoom/rotate at once — the card is a fixed report snapshot, not an
// explorable map.

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

  useEffect(() => {
    if (!containerRef.current || !mapboxConfigured) return;
    const container = containerRef.current;

    let cancelled = false;
    let map: maplibregl.Map | null = null;
    let raf = 0;

    // MapLibre can't consume `mapbox://` styles directly, so resolve the Mapbox
    // style document (mapbox:// → https + token) before creating the map.
    void loadMapboxStyleForMapLibre(styleUrl, { token: MAPBOX_TOKEN })
      .then((style) => {
        if (cancelled) return;

        map = new maplibregl.Map({
          container,
          style: style as unknown as StyleSpecification,
          center: [lng, lat],
          zoom,
          pitch,
          interactive: false,
          attributionControl: false,
          // Needed for `map.getCanvas().toDataURL()` and html-to-image to capture
          // the WebGL canvas for the PDF report — without this WebGL clears the
          // back buffer between frames and the snapshot comes out blank. In
          // MapLibre v5 this WebGL flag lives under `canvasContextAttributes`
          // (Mapbox GL exposed it as a top-level `preserveDrawingBuffer`).
          canvasContextAttributes: { preserveDrawingBuffer: true },
        });
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
        raf = requestAnimationFrame(() => m.resize());
      })
      .catch((error) => {
        console.error('Unable to load the reporter mini-map style for MapLibre', error);
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      map?.remove();
    };
  }, [lat, lng, zoom, pitch, styleUrl]);

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
