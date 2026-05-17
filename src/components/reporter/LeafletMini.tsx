import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// A small, non-interactive Leaflet map for the Roots, Soolar and Boom widgets.
// All interaction handlers are disabled — the card is a fixed report snapshot.

const CARTO_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

interface LeafletMiniProps {
  lat: number;
  lng: number;
  zoom?: number;
  /** Add overlay tile layers (WMS / WMTS) here. */
  onReady: (map: L.Map) => void;
}

export default function LeafletMini({ lat, lng, zoom = 18, onReady }: LeafletMiniProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    });

    L.tileLayer(CARTO_LIGHT, { maxZoom: 20 }).addTo(map);
    onReadyRef.current(map);

    L.circleMarker([lat, lng], {
      radius: 6,
      color: '#ffffff',
      weight: 2,
      fillColor: '#22d3ee',
      fillOpacity: 1,
    }).addTo(map);

    // The container may still be settling its size inside the aspect-ratio
    // card on first paint — re-measure on the next frame.
    const raf = requestAnimationFrame(() => map.invalidateSize());

    return () => {
      cancelAnimationFrame(raf);
      map.remove();
    };
  }, [lat, lng, zoom]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
