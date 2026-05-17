import { useEffect, useState } from 'react';
import L from 'leaflet';
import { reporterApp, deepLink } from '../../../lib/reporterApps';
import {
  REPORTER_NOISE_WMTS,
  wmtsTemplate,
  noiseBandAt,
  type NoiseBand,
} from '../../../lib/noiseSample';
import WidgetCard from '../WidgetCard';
import LeafletMini from '../LeafletMini';
import { useReporterWidget } from './useReporterWidget';

// Boom — road-noise exposure. Recreates boom's view: the BAFU sonBASE
// road-traffic-day noise WMTS overlay. The headline is the dB(A) band sampled
// from the tile pixel under the location.

function addOverlay(map: L.Map) {
  L.tileLayer(wmtsTemplate(REPORTER_NOISE_WMTS), { opacity: 0.7, maxZoom: 21 }).addTo(map);
}

export default function BoomWidget({ lat, lng }: { lat: number; lng: number }) {
  const app = reporterApp('boom');
  const { reloadKey, status, setStatus, retry } = useReporterWidget();
  const [band, setBand] = useState<NoiseBand | null>(null);
  // `quiet` distinguishes "sampled, below 40 dB" from "not yet sampled".
  const [quiet, setQuiet] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setBand(null);
    setQuiet(false);
    noiseBandAt(lat, lng)
      .then((b) => {
        if (ctrl.signal.aborted) return;
        setBand(b);
        setQuiet(b === null);
        setStatus('ok');
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setStatus('error');
      });
    return () => ctrl.abort();
  }, [lat, lng, reloadKey, setStatus]);

  const stat = band ? band.label : quiet ? '< 40 dB' : undefined;

  return (
    <WidgetCard
      label={app.label}
      blurb={app.blurb}
      deepLink={deepLink(app, lat, lng)}
      status={status}
      stat={stat}
      statColor={band?.hex ?? (quiet ? '#34d399' : undefined)}
      error="Noise data unavailable"
      onRetry={retry}
    >
      <LeafletMini key={reloadKey} lat={lat} lng={lng} zoom={18} onReady={addOverlay} />
    </WidgetCard>
  );
}
