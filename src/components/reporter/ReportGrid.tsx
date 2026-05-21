import { useCallback } from 'react';
import ValooWidget from './widgets/ValooWidget';
import RoofsWidget from './widgets/RoofsWidget';
import RootsWidget from './widgets/RootsWidget';
import SoolarWidget from './widgets/SoolarWidget';
import BoomWidget from './widgets/BoomWidget';
import type { ReporterAppId } from '../../lib/reporterApps';
import type { WidgetReportRaw } from './report/types';

// The reporter body: five live widget cards for one location. Each widget
// owns its own data fetch and lifecycle, so this is pure layout. The parent
// keys this component on the coordinates, so a new search remounts all five.
// Selection state + per-widget telemetry are lifted to ReporterView for the
// PDF report builder.

interface ReportGridProps {
  lat: number;
  lng: number;
  selection: Set<ReporterAppId>;
  onToggleSelect: (id: ReporterAppId) => void;
  onReport: (raw: WidgetReportRaw) => void;
}

export default function ReportGrid({ lat, lng, selection, onToggleSelect, onReport }: ReportGridProps) {
  const sel = (id: ReporterAppId) => selection.has(id);
  const toggle = useCallback(
    (id: ReporterAppId) => () => onToggleSelect(id),
    [onToggleSelect],
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <ValooWidget  lat={lat} lng={lng} selected={sel('valoo')}  onToggleSelect={toggle('valoo')}  onReport={onReport} />
      <RoofsWidget  lat={lat} lng={lng} selected={sel('roofs')}  onToggleSelect={toggle('roofs')}  onReport={onReport} />
      <RootsWidget  lat={lat} lng={lng} selected={sel('roots')}  onToggleSelect={toggle('roots')}  onReport={onReport} />
      <SoolarWidget lat={lat} lng={lng} selected={sel('soolar')} onToggleSelect={toggle('soolar')} onReport={onReport} />
      <BoomWidget   lat={lat} lng={lng} selected={sel('boom')}   onToggleSelect={toggle('boom')}   onReport={onReport} />
    </div>
  );
}
