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
import { useI18n } from '../../../contexts/I18nContext';
import type { WidgetReportRaw } from '../report/types';

function addOverlay(map: L.Map) {
  L.tileLayer(wmtsTemplate(REPORTER_NOISE_WMTS), { opacity: 0.7, maxZoom: 21 }).addTo(map);
}

interface BoomWidgetProps {
  lat: number;
  lng: number;
  selected?: boolean;
  onToggleSelect?: () => void;
  onReport?: (raw: WidgetReportRaw) => void;
}

function noiseTone(band: NoiseBand | null): 'good' | 'neutral' | 'warn' | 'bad' {
  if (!band) return 'good'; // < 40 dB — quiet
  if (band.index <= 1) return 'good';     // < 50 dB
  if (band.index <= 3) return 'neutral';  // 50–59 dB
  if (band.index <= 5) return 'warn';     // 60–69 dB
  return 'bad';                           // ≥ 70 dB
}

export default function BoomWidget({ lat, lng, selected, onToggleSelect, onReport }: BoomWidgetProps) {
  const app = reporterApp('boom');
  const { t } = useI18n();
  const { reloadKey, status, setStatus, retry } = useReporterWidget();
  const [band, setBand] = useState<NoiseBand | null>(null);
  const [quiet, setQuiet] = useState(false);

  useEffect(() => {
    const display = band ? band.label : quiet ? '< 40 dB' : null;
    const detail: { labelKey: string; value: string }[] = [];
    if (band) {
      detail.push({ labelKey: 'report.widget.boom.detail.band', value: band.label });
    } else if (quiet) {
      detail.push({ labelKey: 'report.widget.boom.detail.band', value: '< 40 dB' });
    }
    onReport?.({
      id: 'boom',
      status,
      metricDisplay: display,
      detail: detail.length > 0 ? detail : undefined,
      ratingTone: status === 'ok' ? noiseTone(band) : undefined,
      rating: band ? { index: band.index, scaleLength: 8 } : quiet ? { index: 0, scaleLength: 8 } : undefined,
    });
  }, [status, band, quiet, onReport]);

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
      metricLabel={t('page.reporter.widget.metric.road_noise')}
      stat={stat}
      error={t('page.reporter.widget.noise_unavailable')}
      onRetry={retry}
      captureId="reporter-widget-boom"
      selectable
      selected={selected}
      onToggleSelect={onToggleSelect}
    >
      <LeafletMini key={reloadKey} lat={lat} lng={lng} zoom={18} onReady={addOverlay} />
    </WidgetCard>
  );
}
