import { useEffect, useState } from 'react';
import L from 'leaflet';
import { reporterApp, deepLink } from '../../../lib/reporterApps';
import { fetchConstructionYear } from '../../../lib/parcelLookup';
import WidgetCard from '../WidgetCard';
import LeafletMini from '../LeafletMini';
import { useReporterWidget } from './useReporterWidget';

// Roots — construction year. Recreates roots' view: the GeoServer WMS layer
// styled by building construction year (year labels are baked into the
// tiles). The headline year comes from a GeoServer GetFeatureInfo call; if it
// returns nothing the map itself still carries the information.

const GEOSERVER_WMS = 'https://gs-contabo-extra.zeroo.ch/geoserver/project_res/wms';

function addWms(map: L.Map) {
  L.tileLayer
    .wms(GEOSERVER_WMS, {
      layers: 'project_res:parcel_2025_07',
      styles: 'parcel_by_bldg_constr_yr_with_label',
      format: 'image/png8',
      transparent: true,
      maxZoom: 20,
    })
    .addTo(map);
}

export default function RootsWidget({ lat, lng }: { lat: number; lng: number }) {
  const app = reporterApp('roots');
  const { reloadKey, status, setStatus, retry } = useReporterWidget();
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setYear(null);
    fetchConstructionYear(lat, lng, ctrl.signal).then((y) => {
      if (ctrl.signal.aborted) return;
      setYear(y);
      // The WMS map is the deliverable — the card is 'ok' whether or not the
      // year lookup found a value.
      setStatus('ok');
    });
    return () => ctrl.abort();
  }, [lat, lng, reloadKey, setStatus]);

  return (
    <WidgetCard
      label={app.label}
      blurb={app.blurb}
      deepLink={deepLink(app, lat, lng)}
      status={status}
      stat={year != null ? `built ${year}` : undefined}
      onRetry={retry}
    >
      <LeafletMini key={reloadKey} lat={lat} lng={lng} zoom={18} onReady={addWms} />
    </WidgetCard>
  );
}
