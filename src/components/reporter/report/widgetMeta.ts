import type { ReporterAppId } from '../../../lib/reporterApps';
import type { WidgetMeta } from './types';

// Per-widget static configuration for the PDF report:
//   - accent colour (used for the metric tile and the section header underline)
//   - i18n keys for the narrative + methodology bullets (kept here so the
//     EN/FR/DE/IT copy lives entirely in I18nContext and stays translatable)
//   - data-source citation shown in the report appendix
//
// The accent colours echo the live cards: cyan for the SwissNovo headline,
// neutral steel for parcel facts, and a measured palette of green/amber/red
// for the rating-tinted sections (solar yield, road noise).
export const WIDGET_META: Record<ReporterAppId, WidgetMeta> = {
  valoo: {
    id: 'valoo',
    accentHex: '#22d3ee',
    narrativeKey: 'report.widget.valoo.narrative',
    methodologyKeys: [
      'report.widget.valoo.method.1',
      'report.widget.valoo.method.2',
      'report.widget.valoo.method.3',
    ],
    sourceLabel: 'SwissNovo Valoo · parcel_2025_07 hedonic model',
    sourceUrl: 'https://swissnovo-valoo.vercel.app',
  },
  roofs: {
    id: 'roofs',
    accentHex: '#60a5fa',
    narrativeKey: 'report.widget.roofs.narrative',
    methodologyKeys: [
      'report.widget.roofs.method.1',
      'report.widget.roofs.method.2',
      'report.widget.roofs.method.3',
    ],
    sourceLabel: 'swissBUILDINGS3D 3.0 (swisstopo) · SwissNovo Roofs',
    sourceUrl: 'https://www.swisstopo.admin.ch/en/landscape-model-swissbuildings3d-3-0',
  },
  roots: {
    id: 'roots',
    accentHex: '#a78bfa',
    narrativeKey: 'report.widget.roots.narrative',
    methodologyKeys: [
      'report.widget.roots.method.1',
      'report.widget.roots.method.2',
      'report.widget.roots.method.3',
    ],
    sourceLabel: 'GWR / RegBL (BFS) · SwissNovo Roots',
    sourceUrl: 'https://www.bfs.admin.ch/bfs/en/home/registers/federal-buildings-dwellings-register.html',
  },
  soolar: {
    id: 'soolar',
    accentHex: '#f59e0b',
    narrativeKey: 'report.widget.soolar.narrative',
    methodologyKeys: [
      'report.widget.soolar.method.1',
      'report.widget.soolar.method.2',
      'report.widget.soolar.method.3',
    ],
    sourceLabel: 'sonnendach.ch (SFOE / swisstopo) · SwissNovo Soolar',
    sourceUrl: 'https://www.uvek-gis.admin.ch/BFE/sonnendach/',
  },
  boom: {
    id: 'boom',
    accentHex: '#f97316',
    narrativeKey: 'report.widget.boom.narrative',
    methodologyKeys: [
      'report.widget.boom.method.1',
      'report.widget.boom.method.2',
      'report.widget.boom.method.3',
    ],
    sourceLabel: 'sonBASE road-traffic noise (FOEN/BAFU) · SwissNovo Boom',
    sourceUrl: 'https://www.bafu.admin.ch/bafu/en/home/topics/noise/state/data.html',
  },
};

/** Short, human-readable report id e.g. "RPT-3F8K-2RXM". */
export function generateReportId(): string {
  const chunk = () =>
    Array.from({ length: 4 }, () =>
      '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'.charAt(Math.floor(Math.random() * 32)),
    ).join('');
  return `RPT-${chunk()}-${chunk()}`;
}
