import { useState } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { reporterApp, deepLink } from '../../../lib/reporterApps';
import { extractParcelStats } from '../../../lib/parcelLookup';
import WidgetCard from '../WidgetCard';
import MapboxMini, { mapboxConfigured } from '../MapboxMini';
import { useReporterWidget } from './useReporterWidget';

// Roofs — building height. Recreates roofs' 3D view: the shared
// `parcel_2025_07` vector tiles extruded by `bldg_height_max`. An invisible
// flat fill layer is added alongside for an accurate point query.

const PARCEL_TILES_URL = 'https://res-mbtiles-x.gisjoe.com/parcel_2025_07_z12_16';

const HEIGHT_EXPR: unknown[] = ['coalesce', ['to-number', ['get', 'bldg_height_max']], 0];

// roofs' 11-class blue height ramp (roofs/src/components/ParcelMap.tsx).
const HEIGHT_RAMP: unknown[] = [
  'step', HEIGHT_EXPR, '#deebf7',
  5, '#c6dbef', 10, '#9ecae1', 15, '#6baed6', 20, '#4292c6', 25, '#2171b5',
  30, '#08519c', 35, '#08306b', 40, '#042a56', 45, '#041c3a', 50, '#021324',
];

function addLayers(map: MapboxMap) {
  if (!map.getSource('parcel-tiles')) {
    map.addSource('parcel-tiles', { type: 'vector', url: PARCEL_TILES_URL });
  }
  map.addLayer({
    id: 'parcel-3d',
    type: 'fill-extrusion',
    source: 'parcel-tiles',
    'source-layer': 'parcel_2025_07',
    paint: {
      'fill-extrusion-color': HEIGHT_RAMP as never,
      'fill-extrusion-height': HEIGHT_EXPR as never,
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.85,
    },
  });
  // Invisible flat footprint — queried for the height at the pin (accurate
  // regardless of the extrusion's apparent screen offset under pitch).
  map.addLayer({
    id: 'parcel-fill-query',
    type: 'fill',
    source: 'parcel-tiles',
    'source-layer': 'parcel_2025_07',
    paint: { 'fill-opacity': 0 },
  });
}

export default function RoofsWidget({ lat, lng }: { lat: number; lng: number }) {
  const app = reporterApp('roofs');
  const { reloadKey, status, setStatus, retry } = useReporterWidget();
  const [heightMax, setHeightMax] = useState<number | null>(null);

  if (!mapboxConfigured) {
    return (
      <WidgetCard
        label={app.label}
        blurb={app.blurb}
        deepLink={deepLink(app, lat, lng)}
        status="error"
        error="Mapbox token not configured"
      >
        <div />
      </WidgetCard>
    );
  }

  const readHeight = (map: MapboxMap) => {
    try {
      const feats = map.queryRenderedFeatures(map.project([lng, lat]), {
        layers: ['parcel-fill-query'],
      });
      const stats = feats[0]?.properties ? extractParcelStats(feats[0].properties) : null;
      if (stats?.heightMax) {
        setHeightMax(stats.heightMax);
        setStatus('ok');
      } else {
        setStatus('no_data');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <WidgetCard
      label={app.label}
      blurb={app.blurb}
      deepLink={deepLink(app, lat, lng)}
      status={status}
      stat={heightMax != null ? `${heightMax.toFixed(1)} m` : undefined}
      onRetry={retry}
    >
      <MapboxMini
        key={reloadKey}
        lat={lat}
        lng={lng}
        zoom={17.5}
        pitch={50}
        styleUrl="mapbox://styles/mapbox/streets-v12"
        onLoad={addLayers}
        onIdle={readHeight}
      />
    </WidgetCard>
  );
}
