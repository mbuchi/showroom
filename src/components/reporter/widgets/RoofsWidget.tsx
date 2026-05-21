import { useEffect, useState } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { reporterApp, deepLink } from '../../../lib/reporterApps';
import { extractParcelStats } from '../../../lib/parcelLookup';
import WidgetCard from '../WidgetCard';
import MapboxMini, { mapboxConfigured } from '../MapboxMini';
import { useReporterWidget } from './useReporterWidget';
import { useI18n } from '../../../contexts/I18nContext';
import type { WidgetReportRaw } from '../report/types';

const PARCEL_TILES_URL = 'https://res-mbtiles-x.gisjoe.com/parcel_2025_07_z12_16';

const HEIGHT_EXPR: unknown[] = ['coalesce', ['to-number', ['get', 'bldg_height_max']], 0];

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
  map.addLayer({
    id: 'parcel-fill-query',
    type: 'fill',
    source: 'parcel-tiles',
    'source-layer': 'parcel_2025_07',
    paint: { 'fill-opacity': 0 },
  });
}

interface RoofsWidgetProps {
  lat: number;
  lng: number;
  selected?: boolean;
  onToggleSelect?: () => void;
  onReport?: (raw: WidgetReportRaw) => void;
}

export default function RoofsWidget({ lat, lng, selected, onToggleSelect, onReport }: RoofsWidgetProps) {
  const app = reporterApp('roofs');
  const { t } = useI18n();
  const { reloadKey, status, setStatus, retry } = useReporterWidget();
  const [heightMax, setHeightMax] = useState<number | null>(null);
  const [heightMin, setHeightMin] = useState<number | null>(null);

  useEffect(() => {
    const detail: { labelKey: string; value: string }[] = [];
    if (heightMax != null) detail.push({ labelKey: 'report.widget.roofs.detail.max', value: `${heightMax.toFixed(1)} m` });
    if (heightMin != null) detail.push({ labelKey: 'report.widget.roofs.detail.min', value: `${heightMin.toFixed(1)} m` });
    onReport?.({
      id: 'roofs',
      status,
      metricDisplay: heightMax != null ? `${heightMax.toFixed(1)} m` : null,
      detail: detail.length > 0 ? detail : undefined,
    });
  }, [status, heightMax, heightMin, onReport]);

  if (!mapboxConfigured) {
    return (
      <WidgetCard
        label={app.label}
        blurb={app.blurb}
        deepLink={deepLink(app, lat, lng)}
        status="error"
        error={t('page.reporter.widget.mapbox_missing')}
        captureId="reporter-widget-roofs"
        selectable
        selected={selected}
        onToggleSelect={onToggleSelect}
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
        setHeightMin(stats.heightMin);
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
      metricLabel={t('page.reporter.widget.metric.building_height')}
      stat={heightMax != null ? `${heightMax.toFixed(1)} m` : undefined}
      onRetry={retry}
      captureId="reporter-widget-roofs"
      selectable
      selected={selected}
      onToggleSelect={onToggleSelect}
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
