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

    return () => map.remove();
  }, [lat, lng, zoom, pitch, styleUrl]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
