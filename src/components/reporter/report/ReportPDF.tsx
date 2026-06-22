import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ReportPayload, ReportWidgetSection, ReportI18n } from './types';
import type { ParcelInfo } from '../../../lib/parcelInfo';
import { formatReportDate } from './buildReport';

// ── Palette ──────────────────────────────────────────────────────────────
// Mirrors the showroom dark surface system in print-safe tones. The PDF is
// light-on-paper (legal/finance norm) — the dark "ink" palette from the live
// app is inverted for white paper, keeping cyan as the Aireon accent.

const COLOR = {
  ink:        '#0b0d10',
  text:       '#1f2937',
  textSoft:   '#4b5563',
  textMute:   '#6b7280',
  border:     '#e5e7eb',
  borderSoft: '#f1f5f9',
  surface:    '#f8fafc',
  surface2:   '#f1f5f9',
  brand:      '#0e7490',   // deep cyan-700 — used for headings + rules
  accent:     '#06b6d4',   // cyan-500
  red:        '#dc2626',
  brandRedO:  '#dc2626',
  good:       '#15803d',
  neutral:    '#475569',
  warn:       '#b45309',
  bad:        '#b91c1c',
};

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: COLOR.text,
    backgroundColor: '#ffffff',
  },
  pad: { paddingHorizontal: 40 },

  // Cover
  coverHero: {
    backgroundColor: COLOR.ink,
    color: '#ffffff',
    padding: 40,
    paddingTop: 56,
    paddingBottom: 32,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  brandLeft: { fontFamily: 'Helvetica-Bold', color: '#ffffff', fontSize: 22, letterSpacing: 1.4 },
  brandRed: { fontFamily: 'Helvetica-Bold', color: COLOR.brandRedO, fontSize: 22, letterSpacing: 1.4 },
  brandTagline: { marginLeft: 'auto', color: '#9ca3af', fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase' },
  coverKicker: { color: COLOR.accent, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  coverTitle: { color: '#ffffff', fontFamily: 'Helvetica-Bold', fontSize: 30, marginBottom: 6 },
  coverSubtitle: { color: '#e5e7eb', fontSize: 13, marginBottom: 22, fontFamily: 'Helvetica' },
  coverAddress: { color: '#ffffff', fontFamily: 'Helvetica-Bold', fontSize: 16, marginBottom: 2 },
  coverCoords: { color: '#9ca3af', fontFamily: 'Helvetica', fontSize: 10, marginBottom: 20 },
  coverHeroImage: { width: '100%', height: 220, objectFit: 'cover', borderRadius: 6 },
  coverMetaRow: { flexDirection: 'row', marginTop: 24, gap: 0 },
  coverMetaCell: { flex: 1 },
  coverMetaLabel: { color: '#94a3b8', fontSize: 8, letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 4 },
  coverMetaValue: { color: '#ffffff', fontSize: 11, fontFamily: 'Helvetica-Bold' },

  // Body sections
  bodyPad: { paddingHorizontal: 40, paddingTop: 28, paddingBottom: 40 },

  sectionKicker: { color: COLOR.brand, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  sectionTitle: { color: COLOR.ink, fontFamily: 'Helvetica-Bold', fontSize: 18, marginBottom: 6 },
  sectionLead: { color: COLOR.textSoft, fontSize: 10.5, marginBottom: 18, lineHeight: 1.55 },

  hrAccent: { height: 3, backgroundColor: COLOR.accent, width: 36, marginBottom: 14 },

  // Executive summary KPI grid
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0, marginBottom: 8 },
  kpiCell: { width: '50%', padding: 4 },
  kpiCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: COLOR.border,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  kpiLabel: { color: COLOR.textMute, fontSize: 8, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6 },
  kpiName: { color: COLOR.text, fontSize: 9, marginTop: 4, fontFamily: 'Helvetica-Bold' },
  kpiValue: { color: COLOR.ink, fontFamily: 'Helvetica-Bold', fontSize: 18, lineHeight: 1.2 },
  kpiValueMuted: { color: COLOR.textMute, fontFamily: 'Helvetica-Bold', fontSize: 14 },
  kpiAccentBar: { width: 4, height: 28, marginRight: 10, borderRadius: 2 },
  kpiRow: { flexDirection: 'row', alignItems: 'center' },
  kpiBody: { flex: 1 },

  // Parcel fact grid
  factGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  factCell: { width: '50%', padding: 6 },
  factCard: {
    padding: 12,
    backgroundColor: COLOR.surface,
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: COLOR.accent,
  },
  factLabel: { color: COLOR.textMute, fontSize: 8, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 4 },
  factValue: { color: COLOR.ink, fontSize: 11, fontFamily: 'Helvetica-Bold' },
  factValueMute: { color: COLOR.textMute, fontSize: 11, fontFamily: 'Helvetica' },

  // Widget section
  widgetSection: {
    marginBottom: 26,
    borderTopWidth: 1,
    borderTopColor: COLOR.borderSoft,
    paddingTop: 22,
  },
  widgetHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  widgetAccentBar: { width: 4, height: 28, marginRight: 12, borderRadius: 2 },
  widgetHeaderText: { flex: 1 },
  widgetTitle: { color: COLOR.ink, fontFamily: 'Helvetica-Bold', fontSize: 14 },
  widgetBlurb: { color: COLOR.textMute, fontSize: 9.5, marginTop: 1 },

  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR.surface2,
    borderRadius: 4,
    padding: 12,
    marginBottom: 10,
  },
  metricChipLabel: { color: COLOR.textMute, fontSize: 8, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 3 },
  metricChipValue: { color: COLOR.ink, fontFamily: 'Helvetica-Bold', fontSize: 18 },
  metricChipBlock: { flex: 1 },
  noDataChip: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  failedChip: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },

  snapshotBlock: { marginBottom: 12 },
  snapshotImage: { width: '100%', height: 220, objectFit: 'cover', borderRadius: 4 },
  snapshotPlaceholder: {
    width: '100%', height: 80,
    backgroundColor: COLOR.surface,
    borderRadius: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  snapshotPlaceholderText: { color: COLOR.textMute, fontSize: 9 },

  narrative: { color: COLOR.text, fontSize: 10.5, lineHeight: 1.55, marginBottom: 10 },

  methodTitle: { color: COLOR.textMute, fontSize: 8, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6 },
  bullet: { flexDirection: 'row', marginBottom: 4 },
  bulletDot: { color: COLOR.accent, fontFamily: 'Helvetica-Bold', marginRight: 6 },
  bulletText: { color: COLOR.textSoft, fontSize: 9.5, lineHeight: 1.5, flex: 1 },

  sourceLine: {
    marginTop: 8,
    color: COLOR.textMute,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Oblique',
  },

  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  detailCell: { width: '50%', padding: 3 },
  detailLine: { flexDirection: 'row' },
  detailLabel: { color: COLOR.textMute, fontSize: 9, marginRight: 4 },
  detailValue: { color: COLOR.text, fontSize: 9, fontFamily: 'Helvetica-Bold' },

  // Disclaimer
  discBox: {
    marginTop: 14,
    padding: 14,
    backgroundColor: COLOR.surface,
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: COLOR.textMute,
  },
  discTitle: { color: COLOR.ink, fontFamily: 'Helvetica-Bold', fontSize: 11, marginBottom: 6 },
  discBody: { color: COLOR.textSoft, fontSize: 9.5, lineHeight: 1.5 },
  discNotice: { color: COLOR.textMute, fontSize: 8.5, marginTop: 6, fontFamily: 'Helvetica-Oblique' },

  sourcesList: { marginTop: 6 },
  sourcesItem: { flexDirection: 'row', marginBottom: 6 },
  sourcesIndex: { color: COLOR.accent, fontFamily: 'Helvetica-Bold', fontSize: 9, width: 18 },
  sourcesBody: { flex: 1 },
  sourcesName: { color: COLOR.text, fontSize: 9.5, fontFamily: 'Helvetica-Bold' },
  sourcesUrl: { color: COLOR.brand, fontSize: 8.5 },

  // Page footer / header
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 40,
    right: 40,
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 8,
    color: COLOR.textMute,
    borderTopWidth: 0.5,
    borderTopColor: COLOR.border,
    paddingTop: 8,
  },
  footerLeft: { flex: 1 },
  footerBrand: { fontFamily: 'Helvetica-Bold', color: COLOR.text },
  footerRight: { textAlign: 'right' },
});

function toneColor(tone: ReportWidgetSection['ratingTone']): string {
  switch (tone) {
    case 'good':    return COLOR.good;
    case 'warn':    return COLOR.warn;
    case 'bad':     return COLOR.bad;
    default:        return COLOR.neutral;
  }
}

// ── Cover Page ───────────────────────────────────────────────────────────
function CoverPage({ payload }: { payload: ReportPayload }) {
  const { i18n, query, parcel, reportId, generatedAt, locale, widgets, user } = payload;
  const hero = widgets.find((w) => w.snapshotDataUrl)?.snapshotDataUrl;
  const addressLine =
    query.address ??
    (parcel
      ? [parcel.address, parcel.locality].filter(Boolean).join(', ')
      : `${query.lat.toFixed(6)}, ${query.lng.toFixed(6)}`);

  const generatedForLine = user.name || user.email || i18n.notAvailable;

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.coverHero}>
        <View style={styles.brandRow}>
          <Text>
            <Text style={styles.brandLeft}>aire</Text>
            <Text style={styles.brandRed}>o</Text>
            <Text style={styles.brandLeft}>n</Text>
          </Text>
          <Text style={styles.brandTagline}>{i18n.tagline}</Text>
        </View>

        <Text style={styles.coverKicker}>{i18n.reportSubtitle}</Text>
        <Text style={styles.coverTitle}>{i18n.reportTitle}</Text>
        <Text style={styles.coverSubtitle}>{addressLine}</Text>

        {hero ? (
          <Image src={hero} style={styles.coverHeroImage} />
        ) : (
          <View style={[styles.coverHeroImage, { backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: '#94a3b8', fontSize: 10 }}>{i18n.noDataLabel}</Text>
          </View>
        )}

        <View style={styles.coverMetaRow}>
          <View style={styles.coverMetaCell}>
            <Text style={styles.coverMetaLabel}>{i18n.reportIdLabel}</Text>
            <Text style={styles.coverMetaValue}>{reportId}</Text>
          </View>
          <View style={styles.coverMetaCell}>
            <Text style={styles.coverMetaLabel}>{i18n.generatedOnLabel}</Text>
            <Text style={styles.coverMetaValue}>{formatReportDate(generatedAt, locale)}</Text>
          </View>
          <View style={styles.coverMetaCell}>
            <Text style={styles.coverMetaLabel}>{i18n.generatedForLabel}</Text>
            <Text style={styles.coverMetaValue}>{generatedForLine}</Text>
          </View>
        </View>
      </View>

      {/* Executive summary directly under the hero on the cover page */}
      <View style={styles.bodyPad}>
        <Text style={styles.sectionKicker}>01 · {i18n.executiveTitle}</Text>
        <View style={styles.hrAccent} />
        <Text style={styles.sectionLead}>{i18n.executiveLead}</Text>

        <View style={styles.kpiGrid}>
          {widgets.map((w) => (
            <View key={w.id} style={styles.kpiCell} wrap={false}>
              <View style={styles.kpiCard}>
                <View style={styles.kpiRow}>
                  <View style={[styles.kpiAccentBar, { backgroundColor: w.accentHex }]} />
                  <View style={styles.kpiBody}>
                    <Text style={styles.kpiLabel}>{w.metricLabel}</Text>
                    {w.status === 'ok' ? (
                      <Text style={styles.kpiValue}>{w.metricValue}</Text>
                    ) : (
                      <Text style={styles.kpiValueMuted}>
                        {w.status === 'no_data' ? i18n.noDataLabel : i18n.failedLabel}
                      </Text>
                    )}
                    <Text style={styles.kpiName}>{w.label}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      <PageFooter i18n={i18n} reportId={reportId} />
    </Page>
  );
}

// ── Parcel identification page ───────────────────────────────────────────
function ParcelPage({ payload }: { payload: ReportPayload }) {
  const { i18n, parcel, query, reportId } = payload;
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.bodyPad}>
        <Text style={styles.sectionKicker}>02 · {i18n.parcelTitle}</Text>
        <View style={styles.hrAccent} />
        <Text style={styles.sectionLead}>{i18n.parcelLead}</Text>

        <View style={styles.factGrid}>
          <Fact label={i18n.addressLabel}        value={parcel?.address ?? null} />
          <Fact label={i18n.localityLabel}       value={parcel?.locality ?? null} />
          <Fact label={i18n.egridLabel}          value={parcel?.egrid ?? null} mono />
          <Fact label={i18n.zoneLabel}           value={parcel?.zone ?? null} />
          <Fact label={i18n.buildingSizeLabel}   value={formatM2(parcel)} />
          <Fact label={i18n.buildingVolumeLabel} value={formatM3(parcel)} />
          <Fact label={i18n.flatsLabel}          value={parcel?.flats != null ? String(parcel.flats) : null} />
          <Fact label={i18n.coordinatesLabel}    value={`${query.lat.toFixed(6)}, ${query.lng.toFixed(6)}`} mono />
        </View>
      </View>
      <PageFooter i18n={i18n} reportId={reportId} />
    </Page>
  );
}

function Fact({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <View style={styles.factCell} wrap={false}>
      <View style={styles.factCard}>
        <Text style={styles.factLabel}>{label}</Text>
        {value ? (
          <Text style={mono ? [styles.factValue, { fontFamily: 'Courier-Bold' }] : styles.factValue}>{value}</Text>
        ) : (
          <Text style={styles.factValueMute}>-</Text>
        )}
      </View>
    </View>
  );
}

function formatM2(p: ParcelInfo | null): string | null {
  if (!p || p.buildingSizeM2 == null) return null;
  return `${p.buildingSizeM2.toLocaleString('de-CH')} m²`;
}
function formatM3(p: ParcelInfo | null): string | null {
  if (!p || p.buildingVolumeM3 == null) return null;
  return `${p.buildingVolumeM3.toLocaleString('de-CH')} m³`;
}

// ── Widget sections ──────────────────────────────────────────────────────
function WidgetPages({ payload }: { payload: ReportPayload }) {
  const { i18n, widgets, reportId } = payload;

  // Two widgets per page keeps each section ~half-A4 — never splits.
  const pages: ReportWidgetSection[][] = [];
  for (let i = 0; i < widgets.length; i += 2) pages.push(widgets.slice(i, i + 2));

  return (
    <>
      {pages.map((group, pageIdx) => (
        <Page key={pageIdx} size="A4" style={styles.page}>
          <View style={styles.bodyPad}>
            {pageIdx === 0 && (
              <>
                <Text style={styles.sectionKicker}>03 · {i18n.analysesTitle}</Text>
                <View style={styles.hrAccent} />
              </>
            )}
            {group.map((w) => (
              <WidgetSection key={w.id} w={w} i18n={i18n} />
            ))}
          </View>
          <PageFooter i18n={i18n} reportId={reportId} />
        </Page>
      ))}
    </>
  );
}

function WidgetSection({ w, i18n }: { w: ReportWidgetSection; i18n: ReportI18n }) {
  return (
    <View style={styles.widgetSection} wrap={false}>
      <View style={styles.widgetHeader}>
        <View style={[styles.widgetAccentBar, { backgroundColor: w.accentHex }]} />
        <View style={styles.widgetHeaderText}>
          <Text style={styles.widgetTitle}>{w.label} · {w.metricLabel}</Text>
          <Text style={styles.widgetBlurb}>{w.blurb}</Text>
        </View>
        {w.status === 'ok' ? null : w.status === 'no_data' ? (
          <Text style={styles.noDataChip}>{i18n.noDataLabel}</Text>
        ) : w.status === 'error' ? (
          <Text style={styles.failedChip}>{i18n.failedLabel}</Text>
        ) : null}
      </View>

      <View style={styles.metricChip} wrap={false}>
        <View style={styles.metricChipBlock}>
          <Text style={styles.metricChipLabel}>{i18n.metricLabel}</Text>
          {w.status === 'ok' ? (
            <Text style={[styles.metricChipValue, { color: w.accentHex }]}>{w.metricValue}</Text>
          ) : (
            <Text style={[styles.metricChipValue, { color: toneColor('neutral') }]}>-</Text>
          )}
        </View>
      </View>

      {w.snapshotDataUrl ? (
        <View style={styles.snapshotBlock} wrap={false}>
          <Image src={w.snapshotDataUrl} style={styles.snapshotImage} />
        </View>
      ) : (
        <View style={styles.snapshotPlaceholder} wrap={false}>
          <Text style={styles.snapshotPlaceholderText}>{i18n.noDataLabel}</Text>
        </View>
      )}

      {w.detail.length > 0 && (
        <View style={styles.detailGrid}>
          {w.detail.map((d, i) => (
            <View key={i} style={styles.detailCell} wrap={false}>
              <View style={styles.detailLine}>
                <Text style={styles.detailLabel}>{d.label}:</Text>
                <Text style={styles.detailValue}>{d.value}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.narrative}>{w.narrative}</Text>

      <Text style={styles.methodTitle}>{i18n.methodLabel}</Text>
      {w.methodology.map((m, i) => (
        <View key={i} style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{m}</Text>
        </View>
      ))}

      <Text style={styles.sourceLine}>
        {i18n.sourceLabel}: {w.sourceLabel} · {w.sourceUrl}
      </Text>
    </View>
  );
}

// ── Methodology / Disclaimer / Sources ───────────────────────────────────
function ClosingPage({ payload }: { payload: ReportPayload }) {
  const { i18n, widgets, reportId } = payload;
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.bodyPad}>
        <Text style={styles.sectionKicker}>04 · {i18n.sourcesTitle}</Text>
        <View style={styles.hrAccent} />

        <View style={styles.sourcesList}>
          {widgets.map((w, i) => (
            <View key={w.id} style={styles.sourcesItem} wrap={false}>
              <Text style={styles.sourcesIndex}>{String(i + 1).padStart(2, '0')}</Text>
              <View style={styles.sourcesBody}>
                <Text style={styles.sourcesName}>{w.label} · {w.metricLabel}</Text>
                <Text style={styles.sourcesUrl}>{w.sourceLabel}</Text>
                <Text style={styles.sourcesUrl}>{w.sourceUrl}</Text>
              </View>
            </View>
          ))}
          <View style={styles.sourcesItem} wrap={false}>
            <Text style={styles.sourcesIndex}>{String(widgets.length + 1).padStart(2, '0')}</Text>
            <View style={styles.sourcesBody}>
              <Text style={styles.sourcesName}>Federal Register of Buildings and Dwellings (GWR / RegBL)</Text>
              <Text style={styles.sourcesUrl}>Bundesamt für Statistik (BFS)</Text>
              <Text style={styles.sourcesUrl}>https://www.housing-stat.ch/</Text>
            </View>
          </View>
          <View style={styles.sourcesItem} wrap={false}>
            <Text style={styles.sourcesIndex}>{String(widgets.length + 2).padStart(2, '0')}</Text>
            <View style={styles.sourcesBody}>
              <Text style={styles.sourcesName}>SwissTopo basemap &amp; geo.admin.ch</Text>
              <Text style={styles.sourcesUrl}>Federal Office of Topography (swisstopo)</Text>
              <Text style={styles.sourcesUrl}>https://www.swisstopo.admin.ch/</Text>
            </View>
          </View>
        </View>

        <View style={styles.discBox} wrap={false}>
          <Text style={styles.discTitle}>{i18n.disclaimerTitle}</Text>
          <Text style={styles.discBody}>{i18n.disclaimerBody}</Text>
          <Text style={styles.discNotice}>{i18n.disclaimerNotice}</Text>
        </View>
      </View>
      <PageFooter i18n={i18n} reportId={reportId} />
    </Page>
  );
}

function PageFooter({ i18n, reportId }: { i18n: ReportI18n; reportId: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerLeft}>
        <Text style={styles.footerBrand}>{i18n.footerBrand}</Text> · {reportId}
      </Text>
      <Text style={styles.footerRight} render={({ pageNumber, totalPages }) => (
        `${i18n.page} ${pageNumber} ${i18n.of} ${totalPages}`
      )} />
    </View>
  );
}

// ── Document root ────────────────────────────────────────────────────────
export default function ReportPDF({ payload }: { payload: ReportPayload }) {
  return (
    <Document
      title={payload.i18n.reportTitle}
      author="Aireon Showroom"
      subject={payload.query.address ?? payload.reportId}
      creator="Aireon Showroom"
      producer="Aireon Showroom · @react-pdf/renderer"
    >
      <CoverPage payload={payload} />
      <ParcelPage payload={payload} />
      <WidgetPages payload={payload} />
      <ClosingPage payload={payload} />
    </Document>
  );
}
