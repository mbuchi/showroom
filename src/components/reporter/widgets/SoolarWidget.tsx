import { useEffect, useState } from 'react';
import L from 'leaflet';
import { reporterApp, deepLink } from '../../../lib/reporterApps';
import { SOLAR_WMTS, totalYieldAt, formatKWh } from '../../../lib/solarLookup';
import WidgetCard from '../WidgetCard';
import LeafletMini from '../LeafletMini';
import { useReporterWidget } from './useReporterWidget';

// Soolar — solar PV potential. Recreates soolar's view: the swisstopo/BFE
// Sonnendach WMTS roof-suitability overlay. The headline is the total PV
// yield (kWh/yr) of the roofs at the location, from a geo.admin identify.

function addOverlay(map: L.Map) {
  L.tileLayer(SOLAR_WMTS, { opacity: 0.85, maxNativeZoom: 20, maxZoom: 21 }).addTo(map);
}

export default function SoolarWidget({ lat, lng }: { lat: number; lng: number }) {
  const app = reporterApp('soolar');
  const { reloadKey, status, setStatus, retry } = useReporterWidget();
  const [yieldKWh, setYieldKWh] = useState<number | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setYieldKWh(null);
    totalYieldAt(lat, lng, ctrl.signal)
      .then((total) => {
        if (ctrl.signal.aborted) return;
        if (total != null) {
          setYieldKWh(total);
          setStatus('ok');
        } else {
          setStatus('no_data');
        }
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setStatus('error');
      });
    return () => ctrl.abort();
  }, [lat, lng, reloadKey, setStatus]);

  return (
    <WidgetCard
      label={app.label}
      blurb={app.blurb}
      deepLink={deepLink(app, lat, lng)}
      status={status}
      stat={yieldKWh != null ? formatKWh(yieldKWh) : undefined}
      error="Solar data unavailable"
      onRetry={retry}
    >
      <LeafletMini key={reloadKey} lat={lat} lng={lng} zoom={19} onReady={addOverlay} />
    </WidgetCard>
  );
}
