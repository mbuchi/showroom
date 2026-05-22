import { describe, it, expect } from 'vitest';
import { buildReportPayload, formatReportDate, reportFilename } from '../buildReport';
import type { WidgetReportRaw } from '../types';

// Stub translator: returns the key + interpolated vars suffix. Lets us assert
// that the report builder reaches into i18n with the right keys without
// running the real I18n provider.
const t = (key: string, vars?: Record<string, string | number>): string => {
  if (!vars) return key;
  return `${key}{${Object.entries(vars).map(([k, v]) => `${k}=${v}`).join(',')}}`;
};

describe('buildReportPayload', () => {
  const baseArgs = {
    lat: 47.3769,
    lng: 8.5417,
    address: 'Bahnhofstrasse 1, 8001 Zürich',
    locale: 'en' as const,
    parcel: null,
    user: { name: 'Test User', email: 'test@example.com' },
    selection: new Set(['valoo', 'roofs'] as const),
    rawByWidget: {
      valoo: {
        id: 'valoo' as const,
        status: 'ok' as const,
        metricDisplay: "CHF 8'450 /m²",
      } satisfies WidgetReportRaw,
      roofs: {
        id: 'roofs' as const,
        status: 'no_data' as const,
        metricDisplay: null,
      } satisfies WidgetReportRaw,
    },
    snapshots: { valoo: 'data:image/png;base64,AAA' },
    t,
  };

  it('only includes selected widgets, in canonical order', () => {
    const payload = buildReportPayload(baseArgs);
    expect(payload.widgets.map((w) => w.id)).toEqual(['valoo', 'roofs']);
  });

  it('skips unselected widgets even when their raw data is present', () => {
    const payload = buildReportPayload({
      ...baseArgs,
      selection: new Set(['valoo'] as const),
      rawByWidget: {
        ...baseArgs.rawByWidget,
        boom: { id: 'boom', status: 'ok', metricDisplay: '55–59.9 dB' },
      },
    });
    expect(payload.widgets.map((w) => w.id)).toEqual(['valoo']);
  });

  it('maps widget metric display through to the section', () => {
    const payload = buildReportPayload(baseArgs);
    const valoo = payload.widgets.find((w) => w.id === 'valoo')!;
    expect(valoo.metricValue).toBe("CHF 8'450 /m²");
    expect(valoo.status).toBe('ok');
    expect(valoo.snapshotDataUrl).toBe('data:image/png;base64,AAA');
  });

  it('renders an em-dash for widgets without a metric display', () => {
    const payload = buildReportPayload(baseArgs);
    const roofs = payload.widgets.find((w) => w.id === 'roofs')!;
    expect(roofs.metricValue).toBe('—');
    expect(roofs.status).toBe('no_data');
    expect(roofs.snapshotDataUrl).toBeNull();
  });

  it('produces a stable report id matching the RPT-XXXX-YYYY pattern', () => {
    const payload = buildReportPayload(baseArgs);
    expect(payload.reportId).toMatch(/^RPT-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it('attaches accent + source citation per widget from WIDGET_META', () => {
    const payload = buildReportPayload(baseArgs);
    const valoo = payload.widgets.find((w) => w.id === 'valoo')!;
    expect(valoo.accentHex).toBe('#22d3ee');
    expect(valoo.sourceLabel).toMatch(/Valoo/);
    expect(valoo.sourceUrl).toMatch(/^https?:\/\//);
    expect(valoo.methodology).toHaveLength(3);
  });

  it('translates the metric label via i18n', () => {
    const payload = buildReportPayload(baseArgs);
    const valoo = payload.widgets.find((w) => w.id === 'valoo')!;
    expect(valoo.metricLabel).toBe('page.reporter.widget.metric.market_value');
  });

  it('snapshot:null falls back to null on the section', () => {
    const payload = buildReportPayload({ ...baseArgs, snapshots: {} });
    expect(payload.widgets[0]!.snapshotDataUrl).toBeNull();
  });
});

describe('formatReportDate', () => {
  it('formats a valid ISO date in the locale', () => {
    expect(formatReportDate('2026-05-21T12:00:00Z', 'en')).toMatch(/2026/);
  });

  it('falls back to the date prefix on a bad input', () => {
    expect(formatReportDate('not-a-date-string', 'en')).toBe('not-a-date');
  });
});

describe('reportFilename', () => {
  it('builds a lowercased PDF filename anchored by the report id', () => {
    expect(reportFilename('RPT-3F8K-2RXM')).toBe('showroom-report-rpt-3f8k-2rxm.pdf');
  });
});
