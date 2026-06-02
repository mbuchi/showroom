import { useEffect, useState } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { reporterApp, deepLink } from '../../../lib/reporterApps';
import { extractParcelStats } from '../../../lib/parcelLookup';
import WidgetCard from '../WidgetCard';
import MapboxMini, { mapboxConfigured } from '../MapboxMini';
import { useReporterWidget } from './useReporterWidget';
import { useI18n } from '../../../contexts/I18nContext';
import type { WidgetReportRaw } from '../report/types';

// Valoo — parcel valuation. Recreates valoo's choropleth: the shared
// `parcel_2025_07` vector tiles, filled by `estimated_price_m2`. The headline
// CHF/m² is read from the rendered parcel under the pin.

const PARCEL_TILES_URL = 'https://res-mbtiles-x.gisjoe.com/parcel_2025_07_z12_16';

const PRICE_RAMP: unknown[] = [
  'step',
  ['coalesce', ['get', 'estimated_price_m2'], 0],
  '#006837',
  3000, '#006837', 3900, '#1a9850', 4800, '#66bd63', 5700, '#a6d96a',
  6600, '#d9ef8b', 7500, '#ffffbf', 8400, '#fee08b', 9300, '#fdae61',
  10200, '#f46d43', 11100, '#d73027', 12000, '#a50026',
];

function addLayers(map: MapboxMap) {
  if (!map.getSource('parcel-tiles')) {
    map.addSource('parcel-tiles', { type: 'vector', url: PARCEL_TILES_URL });
  }
  map.addLayer({
    id: 'parcel-fill',
    type: 'fill',
    source: 'parcel-tiles',
    'source-layer': 'parcel_2025_07',
    paint: { 'fill-opacity': 0.7, 'fill-color': PRICE_RAMP as never },
  });
  map.addLayer({
    id: 'parcel-outline',
    type: 'line',
    source: 'parcel-tiles',
    'source-layer': 'parcel_2025_07',
    paint: { 'line-color': '#475569', 'line-width': 1, 'line-opacity': 0.8 },
  });
}

interface ValooWidgetProps {
  lat: number;
  lng: number;
  selected?: boolean;
  onToggleSelect?: () => void;
  onReport?: (raw: WidgetReportRaw) => void;
}

// Branch the Mapbox basemap between light/dark to match the suite theme,
// mirroring the rest of showroom's maps. The app drives the theme via the
// `dark` class on <html>, so we read it there and re-render if it flips.
function useMapboxStyleUrl() {
  const read = () =>
    document.documentElement.classList.contains('dark')
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11';
  const [styleUrl, setStyleUrl] = useState(read);
  useEffect(() => {
    const obs = new MutationObserver(() => setStyleUrl(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setStyleUrl(read());
    return () => obs.disconnect();
  }, []);
  return styleUrl;
}

export default function ValooWidget({ lat, lng, selected, onToggleSelect, onReport }: ValooWidgetProps) {
  const app = reporterApp('valoo');
  const { t } = useI18n();
  const { reloadKey, status, setStatus, retry } = useReporterWidget();
  const [priceM2, setPriceM2] = useState<number | null>(null);
  const styleUrl = useMapboxStyleUrl();

  useEffect(() => {
    onReport?.({
      id: 'valoo',
      status,
      metricDisplay: priceM2 != null ? `CHF ${priceM2.toLocaleString('de-CH')} /m²` : null,
      detail: priceM2 != null ? [{ labelKey: 'report.widget.valoo.detail.price_m2', value: `${priceM2.toLocaleString('de-CH')} CHF/m²` }] : undefined,
    });
  }, [status, priceM2, onReport]);

  if (!mapboxConfigured) {
    return (
      <WidgetCard
        label={app.label}
        blurb={app.blurb}
        deepLink={deepLink(app, lat, lng)}
        status="error"
        error={t('page.reporter.widget.mapbox_missing')}
        captureId="reporter-widget-valoo"
        selectable
        selected={selected}
        onToggleSelect={onToggleSelect}
      >
        <div />
      </WidgetCard>
    );
  }

  const readPrice = (map: MapboxMap) => {
    try {
      const feats = map.queryRenderedFeatures(map.project([lng, lat]), {
        layers: ['parcel-fill'],
      });
      const stats = feats[0]?.properties ? extractParcelStats(feats[0].properties) : null;
      if (stats?.priceM2) {
        setPriceM2(stats.priceM2);
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
      metricLabel={t('page.reporter.widget.metric.market_value')}
      stat={priceM2 != null ? `CHF ${priceM2.toLocaleString('de-CH')} /m²` : undefined}
      onRetry={retry}
      captureId="reporter-widget-valoo"
      selectable
      selected={selected}
      onToggleSelect={onToggleSelect}
    >
      <MapboxMini
        key={reloadKey}
        lat={lat}
        lng={lng}
        zoom={17}
        styleUrl={styleUrl}
        onLoad={addLayers}
        onIdle={readPrice}
      />
    </WidgetCard>
  );
}
