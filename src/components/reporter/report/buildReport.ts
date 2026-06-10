import type { Locale } from '@aireon/shared';
import type { ReporterAppId } from '../../../lib/reporterApps';
import { REPORTER_APPS, deepLink, reporterApp } from '../../../lib/reporterApps';
import type { ParcelInfo } from '../../../lib/parcelInfo';
import { WIDGET_META, generateReportId } from './widgetMeta';
import type {
  ReportI18n,
  ReportPayload,
  ReportWidgetSection,
  WidgetReportRaw,
} from './types';

interface BuildArgs {
  lat: number;
  lng: number;
  address: string | null;
  locale: Locale;
  parcel: ParcelInfo | null;
  user: { name: string | null; email: string | null };
  selection: Set<ReporterAppId>;
  rawByWidget: Partial<Record<ReporterAppId, WidgetReportRaw>>;
  snapshots: Partial<Record<ReporterAppId, string | null>>;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

// Assemble the final ReportPayload from the live widget telemetry. Pure given
// `t` — unit-testable with a stub translator. The order of sections follows
// the canonical app order (valoo → roofs → roots → soolar → boom), keeping the
// PDF consistent across runs regardless of which widget loads first.
export function buildReportPayload(args: BuildArgs): ReportPayload {
  const { lat, lng, address, locale, parcel, user, selection, rawByWidget, snapshots, t } = args;

  const widgets: ReportWidgetSection[] = REPORTER_APPS
    .filter((a) => selection.has(a.id))
    .map((app) => buildSection(app.id, args, t));

  return {
    generatedAt: new Date().toISOString(),
    reportId: generateReportId(),
    locale,
    query: { lat, lng, address },
    parcel,
    user,
    widgets,
    i18n: buildReportI18n(t),
  };
  // Reference `rawByWidget` and `snapshots` via buildSection to satisfy noUnused.
  void rawByWidget; void snapshots;
}

function buildSection(
  id: ReporterAppId,
  args: BuildArgs,
  t: BuildArgs['t'],
): ReportWidgetSection {
  const meta = WIDGET_META[id];
  const app = reporterApp(id);
  const raw = args.rawByWidget[id];
  const snapshot = args.snapshots[id] ?? null;

  return {
    id,
    label: app.label,
    blurb: t(`report.widget.${id}.blurb`),
    status: raw?.status ?? 'loading',
    metricLabel: t(`page.reporter.widget.metric.${metricKey(id)}`),
    metricValue: raw?.metricDisplay ?? '—',
    narrative: t(meta.narrativeKey),
    methodology: meta.methodologyKeys.map((k) => t(k)),
    sourceLabel: meta.sourceLabel,
    sourceUrl: meta.sourceUrl,
    deepLink: deepLink(app, args.lat, args.lng),
    accentHex: meta.accentHex,
    ratingTone: raw?.ratingTone,
    rating: raw?.rating,
    detail:
      raw?.detail?.map((d) => ({
        label: t(d.labelKey),
        value: d.value,
      })) ?? [],
    snapshotDataUrl: snapshot,
  };
}

function metricKey(id: ReporterAppId): string {
  switch (id) {
    case 'valoo':  return 'market_value';
    case 'roofs':  return 'building_height';
    case 'roots':  return 'construction_year';
    case 'soolar': return 'solar_potential';
    case 'boom':   return 'road_noise';
  }
}

export function buildReportI18n(
  t: (key: string, vars?: Record<string, string | number>) => string,
): ReportI18n {
  return {
    brand: 'AIREON',
    tagline: t('report.pdf.tagline'),
    reportTitle: t('report.pdf.title'),
    reportSubtitle: t('report.pdf.subtitle'),
    reportIdLabel: t('report.pdf.report_id'),
    generatedOnLabel: t('report.pdf.generated_on'),
    generatedForLabel: t('report.pdf.generated_for'),
    executiveTitle: t('report.pdf.executive_title'),
    executiveLead: t('report.pdf.executive_lead'),
    parcelTitle: t('report.pdf.parcel_title'),
    parcelLead: t('report.pdf.parcel_lead'),
    analysesTitle: t('report.pdf.analyses_title'),
    methodologyTitle: t('report.pdf.methodology_title'),
    sourcesTitle: t('report.pdf.sources_title'),
    disclaimerTitle: t('report.pdf.disclaimer_title'),
    disclaimerBody: t('report.pdf.disclaimer_body'),
    disclaimerNotice: t('report.pdf.disclaimer_notice'),
    addressLabel: t('report.pdf.address'),
    localityLabel: t('report.pdf.locality'),
    coordinatesLabel: t('report.pdf.coordinates'),
    egridLabel: t('report.pdf.egrid'),
    zoneLabel: t('report.pdf.zone'),
    buildingSizeLabel: t('report.pdf.building_size'),
    buildingVolumeLabel: t('report.pdf.building_volume'),
    flatsLabel: t('report.pdf.flats'),
    notAvailable: t('report.pdf.not_available'),
    metricLabel: t('report.pdf.metric'),
    narrativeLabel: t('report.pdf.assessment'),
    methodLabel: t('report.pdf.method'),
    sourceLabel: t('report.pdf.source'),
    liveAppLabel: t('report.pdf.live_app'),
    noDataLabel: t('report.pdf.no_data'),
    failedLabel: t('report.pdf.failed'),
    page: t('report.pdf.page'),
    of: t('report.pdf.of'),
    footerBrand: t('report.pdf.footer_brand'),
  };
}

/** Format the report date for filenames + the cover: 2026-05-21. */
export function formatReportDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const bcp47 = locale === 'en' ? 'en-GB' : locale === 'de' ? 'de-CH' : locale === 'fr' ? 'fr-CH' : 'it-CH';
  return new Intl.DateTimeFormat(bcp47, {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(d);
}

/** Filename-safe filename: "showroom-report-RPT-XXXX-YYYY.pdf". */
export function reportFilename(reportId: string): string {
  return `showroom-report-${reportId.toLowerCase()}.pdf`;
}
