import { useEffect, useState } from 'react';
import L from 'leaflet';
import { reporterApp, deepLink } from '../../../lib/reporterApps';
import {
  SOLAR_WMTS,
  identifySolarAt,
  summarizeYield,
  formatKWh,
  type SolarRoofFeature,
} from '../../../lib/solarLookup';
import WidgetCard from '../WidgetCard';
import LeafletMini from '../LeafletMini';
import { useReporterWidget } from './useReporterWidget';
import { useI18n } from '../../../contexts/I18nContext';
import type { WidgetReportRaw } from '../report/types';

function addOverlay(map: L.Map) {
  L.tileLayer(SOLAR_WMTS, { opacity: 0.85, maxNativeZoom: 20, maxZoom: 21 }).addTo(map);
}

interface SoolarWidgetProps {
  lat: number;
  lng: number;
  selected?: boolean;
  onToggleSelect?: () => void;
  onReport?: (raw: WidgetReportRaw) => void;
}

function totalArea(features: SolarRoofFeature[]): number {
  let total = 0;
  for (const f of features) {
    const p = (f.attributes ?? f.properties ?? {}) as Record<string, unknown>;
    const a = typeof p.flaeche === 'number' ? p.flaeche : Number(p.flaeche);
    if (Number.isFinite(a)) total += a as number;
  }
  return total;
}

export default function SoolarWidget({ lat, lng, selected, onToggleSelect, onReport }: SoolarWidgetProps) {
  const app = reporterApp('soolar');
  const { t } = useI18n();
  const { reloadKey, status, setStatus, retry } = useReporterWidget();
  const [yieldKWh, setYieldKWh] = useState<number | null>(null);
  const [roofCount, setRoofCount] = useState<number | null>(null);
  const [suitableM2, setSuitableM2] = useState<number | null>(null);

  useEffect(() => {
    const detail: { labelKey: string; value: string }[] = [];
    if (roofCount != null) detail.push({ labelKey: 'report.widget.soolar.detail.roofs', value: String(roofCount) });
    if (suitableM2 != null) detail.push({ labelKey: 'report.widget.soolar.detail.area', value: `${Math.round(suitableM2).toLocaleString('de-CH')} m²` });
    onReport?.({
      id: 'soolar',
      status,
      metricDisplay: yieldKWh != null ? formatKWh(yieldKWh) : null,
      detail: detail.length > 0 ? detail : undefined,
      ratingTone: yieldKWh != null
        ? yieldKWh >= 20_000 ? 'good' : yieldKWh >= 5_000 ? 'neutral' : 'warn'
        : undefined,
    });
  }, [status, yieldKWh, roofCount, suitableM2, onReport]);

  useEffect(() => {
    const ctrl = new AbortController();
    setYieldKWh(null);
    setRoofCount(null);
    setSuitableM2(null);
    identifySolarAt(lat, lng, ctrl.signal)
      .then((features) => {
        if (ctrl.signal.aborted) return;
        if (features.length === 0) {
          setStatus('no_data');
          return;
        }
        setYieldKWh(summarizeYield(features));
        setRoofCount(features.length);
        setSuitableM2(totalArea(features));
        setStatus('ok');
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
      metricLabel={t('page.reporter.widget.metric.solar_potential')}
      stat={yieldKWh != null ? formatKWh(yieldKWh) : undefined}
      error={t('page.reporter.widget.solar_unavailable')}
      onRetry={retry}
      captureId="reporter-widget-soolar"
      selectable
      selected={selected}
      onToggleSelect={onToggleSelect}
    >
      <LeafletMini key={reloadKey} lat={lat} lng={lng} zoom={19} onReady={addOverlay} />
    </WidgetCard>
  );
}
