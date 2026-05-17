import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// A small, non-interactive Mapbox GL map for the Valoo and Roofs widgets.
// `interactive: false` disables all drag/zoom/rotate at once — the card is a
// fixed report snapshot, not an explorable map.

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

export const mapboxConfigured = Boolean(MAPBOX_TOKEN);

interface MapboxMiniProps {
  lat: number;
  lng: number;
  zoom?: number;
  pitch?: number;
  styleUrl: string;
  /** Called once on map 'load' — add sources/layers here. */
  onLoad: (map: mapboxgl.Map) => void;
  /** Called after the map first goes 'idle' — read rendered features here. */
  onIdle?: (map: mapboxgl.Map) => void;
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

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [lng, lat],
      zoom,
      pitch,
      interactive: false,
      attributionControl: false,
    });

    let idleFired = false;
    const handleIdle = () => {
      if (idleFired) return;
      idleFired = true;
      onIdleRef.current?.(map);
    };

    map.on('load', () => {
      onLoadRef.current(map);
      new mapboxgl.Marker({ color: '#22d3ee' }).setLngLat([lng, lat]).addTo(map);
      map.on('idle', handleIdle);
    });

    // Defensive re-measure on the next frame, mirroring LeafletMini — the
    // container can still be settling inside the aspect-ratio card on first
    // paint.
    const raf = requestAnimationFrame(() => map.resize());

    return () => {
      cancelAnimationFrame(raf);
      map.remove();
    };
  }, [lat, lng, zoom, pitch, styleUrl]);

  // Two divs on purpose: Mapbox adds the `.mapboxgl-map` class (which forces
  // `position: relative`) to whatever element it is given. If that element
  // also carried Tailwind's `absolute inset-0`, Mapbox's rule would override
  // `position` and `inset-0` would stop sizing it — collapsing the map to
  // height 0. So the OUTER div owns `absolute inset-0`, and the INNER div —
  // the actual Mapbox container — is sized by `h-full w-full`, which works
  // regardless of its `position`.
  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
