import type { Locale } from '@swissnovo/shared';
import type { ReporterAppId } from '../../../lib/reporterApps';
import type { WidgetStatus } from '../WidgetCard';
import type { ParcelInfo } from '../../../lib/parcelInfo';

// Raw telemetry one widget emits up to ReporterView so the report builder
// can assemble a per-widget section without having to re-fetch anything.
export interface WidgetReportRaw {
  id: ReporterAppId;
  status: WidgetStatus;
  /** Whatever the card chose to render as its headline value, e.g. "CHF 8'450 /m²". */
  metricDisplay: string | null;
  /** Optional secondary key/value lines specific to the widget (e.g. solar roof count). */
  detail?: { labelKey: string; value: string }[];
  /** Optional rating tone — drives the PDF accent bar. */
  ratingTone?: 'good' | 'neutral' | 'warn' | 'bad';
  /** Optional rating index + scale (0-based; e.g. 3 of 7 GEAK-style bands). */
  rating?: { index: number; scaleLength: number };
}

// Per-widget visual + sourcing config — static, looked up by widget id.
export interface WidgetMeta {
  id: ReporterAppId;
  accentHex: string;
  /** i18n key for the long-form narrative paragraph in the PDF. */
  narrativeKey: string;
  /** i18n keys for the methodology bullets in the PDF. */
  methodologyKeys: string[];
  /** Citation label for the data source (DE/FR/IT/EN). */
  sourceLabel: string;
  sourceUrl: string;
}

// Final, fully-assembled report payload handed to ReportPDF.
export interface ReportWidgetSection {
  id: ReporterAppId;
  label: string;
  blurb: string;
  status: WidgetStatus;
  metricLabel: string;
  metricValue: string;
  narrative: string;
  methodology: string[];
  sourceLabel: string;
  sourceUrl: string;
  deepLink: string;
  accentHex: string;
  ratingTone?: 'good' | 'neutral' | 'warn' | 'bad';
  rating?: { index: number; scaleLength: number };
  detail: { label: string; value: string }[];
  /** Data-URL PNG snapshot of the live widget map; null = capture failed. */
  snapshotDataUrl: string | null;
}

export interface ReportPayload {
  generatedAt: string;     // ISO timestamp
  reportId: string;        // short human-friendly id e.g. "RPT-3F8K-2RXM"
  locale: Locale;
  query: { lat: number; lng: number; address: string | null };
  parcel: ParcelInfo | null;
  user: { name: string | null; email: string | null };
  widgets: ReportWidgetSection[];
  /** Translated UI strings used inside the PDF document — handed in via dict
   *  rather than re-resolving via context (the PDF render runs out-of-tree). */
  i18n: ReportI18n;
}

export interface ReportI18n {
  // Header / cover
  brand: string;
  tagline: string;
  reportTitle: string;
  reportSubtitle: string;
  reportIdLabel: string;
  generatedOnLabel: string;
  generatedForLabel: string;
  // Sections
  executiveTitle: string;
  executiveLead: string;
  parcelTitle: string;
  parcelLead: string;
  analysesTitle: string;
  methodologyTitle: string;
  sourcesTitle: string;
  disclaimerTitle: string;
  disclaimerBody: string;
  disclaimerNotice: string;
  // Field labels
  addressLabel: string;
  localityLabel: string;
  coordinatesLabel: string;
  egridLabel: string;
  zoneLabel: string;
  buildingSizeLabel: string;
  buildingVolumeLabel: string;
  flatsLabel: string;
  notAvailable: string;
  // Per-widget section
  metricLabel: string;
  narrativeLabel: string;
  methodLabel: string;
  sourceLabel: string;
  liveAppLabel: string;
  noDataLabel: string;
  failedLabel: string;
  // Footer
  page: string; // "Page" prefix
  of: string;   // "of" between current and total
  footerBrand: string;
}
