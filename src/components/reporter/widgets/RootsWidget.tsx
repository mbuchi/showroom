import { useEffect, useState } from 'react';
import L from 'leaflet';
import { reporterApp, deepLink } from '../../../lib/reporterApps';
import { fetchConstructionYear } from '../../../lib/parcelLookup';
import WidgetCard from '../WidgetCard';
import LeafletMini from '../LeafletMini';
import { useReporterWidget } from './useReporterWidget';
import { useI18n } from '../../../contexts/I18nContext';
import type { WidgetReportRaw } from '../report/types';

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

interface RootsWidgetProps {
  lat: number;
  lng: number;
  selected?: boolean;
  onToggleSelect?: () => void;
  onReport?: (raw: WidgetReportRaw) => void;
}

export default function RootsWidget({ lat, lng, selected, onToggleSelect, onReport }: RootsWidgetProps) {
  const app = reporterApp('roots');
  const { t } = useI18n();
  const { reloadKey, status, setStatus, retry } = useReporterWidget();
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    const detail: { labelKey: string; value: string }[] = [];
    if (year != null) {
      const age = new Date().getFullYear() - year;
      detail.push({ labelKey: 'report.widget.roots.detail.age', value: `${age} years` });
    }
    onReport?.({
      id: 'roots',
      status,
      metricDisplay: year != null ? String(year) : null,
      detail: detail.length > 0 ? detail : undefined,
    });
  }, [status, year, onReport]);

  useEffect(() => {
    const ctrl = new AbortController();
    setYear(null);
    fetchConstructionYear(lat, lng, ctrl.signal).then((y) => {
      if (ctrl.signal.aborted) return;
      setYear(y);
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
      metricLabel={t('page.reporter.widget.metric.construction_year')}
      stat={year != null ? String(year) : undefined}
      onRetry={retry}
      captureId="reporter-widget-roots"
      selectable
      selected={selected}
      onToggleSelect={onToggleSelect}
    >
      <LeafletMini key={reloadKey} lat={lat} lng={lng} zoom={18} onReady={addWms} />
    </WidgetCard>
  );
}
