import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapPin, RefreshCw, AlertTriangle, FileBarChart, FileDown } from 'lucide-react';
import Navbar from '../Navbar';
import AddressSearch from './AddressSearch';
import ReportGrid from './ReportGrid';
import ParcelInfoStrip from './ParcelInfoStrip';
import ReportDialog from './report/ReportDialog';
import ReporterClaire from './ReporterClaire';
import { navigate, useRoute } from '../../lib/router';
import { isGeocodingConfigured } from '../../lib/geocode';
import { signal } from '../../lib/signal';
import { useI18n } from '../../contexts/I18nContext';
import type { ReporterAppId } from '../../lib/reporterApps';
import { REPORTER_APPS } from '../../lib/reporterApps';
import type { ParcelInfo } from '../../lib/parcelInfo';
import type { WidgetReportRaw } from './report/types';

interface ReportParams {
  lat: number;
  lng: number;
  address: string | null;
}

function parseParams(search: string): ReportParams | null {
  const p = new URLSearchParams(search);
  const lat = Number.parseFloat(p.get('lat') ?? '');
  const lng = Number.parseFloat(p.get('lng') ?? '');
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng, address: p.get('q') };
}

function allIds(): Set<ReporterAppId> {
  return new Set<ReporterAppId>(REPORTER_APPS.map((a) => a.id));
}

export default function ReporterView() {
  const { search } = useRoute();
  const params = parseParams(search);
  const { t } = useI18n();

  // Bumped by "Regenerate" — remounts the widget grid for a fresh capture.
  const [regenKey, setRegenKey] = useState(0);

  // Selection of widgets to include in the generated PDF report. Defaults to
  // all five and persists across regenerates; resets when location changes.
  const [selection, setSelection] = useState<Set<ReporterAppId>>(allIds);

  // Latest telemetry from each widget, fed back via onReport. Cleared whenever
  // a fresh search starts so we never show stale headline values in the PDF.
  const [rawByWidget, setRawByWidget] = useState<
    Partial<Record<ReporterAppId, WidgetReportRaw>>
  >({});

  // Parcel facts for the report's identification page — lifted from the strip
  // so the PDF can embed them without a second /api/parcel-data round-trip.
  const [parcel, setParcel] = useState<ParcelInfo | null>(null);

  const [reportOpen, setReportOpen] = useState(false);

  // Reset everything when the location changes (new search).
  useEffect(() => {
    setRegenKey(0);
    setSelection(allIds());
    setRawByWidget({});
    setParcel(null);
  }, [params?.lat, params?.lng]);

  const toggleSelect = useCallback((id: ReporterAppId) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleReport = useCallback((raw: WidgetReportRaw) => {
    setRawByWidget((prev) => {
      const cur = prev[raw.id];
      if (
        cur &&
        cur.status === raw.status &&
        cur.metricDisplay === raw.metricDisplay &&
        JSON.stringify(cur.detail) === JSON.stringify(raw.detail) &&
        cur.ratingTone === raw.ratingTone
      ) {
        return prev;
      }
      return { ...prev, [raw.id]: raw };
    });
  }, []);

  const handleParcel = useCallback((info: ParcelInfo | null) => {
    setParcel(info);
  }, []);

  const regenerate = useCallback(() => {
    setRegenKey((k) => k + 1);
    setRawByWidget({});
  }, []);

  const openReport = useCallback(() => {
    if (!params) return;
    void signal.send('Open Report Builder', {
      lat: params.lat,
      lng: params.lng,
      address: params.address ?? undefined,
      metaData: { widgets: Array.from(selection) },
    });
    setReportOpen(true);
  }, [params, selection]);

  const selectedCount = selection.size;
  const liveSelectedCount = useMemo(
    () =>
      Array.from(selection).filter((id) => rawByWidget[id]?.status === 'ok').length,
    [selection, rawByWidget],
  );

  return (
    <>
      <Navbar showSearch={false} openWithLocation={params ?? null} />

      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-cyan-400 mb-1.5">
            <FileBarChart size={16} />
            <h1 className="text-sm uppercase tracking-[0.18em] font-bold">{t('page.reporter.kicker')}</h1>
          </div>
          <p className="text-sm text-gray-400 max-w-2xl">
            {t('page.reporter.intro')}
          </p>
        </div>

        {!isGeocodingConfigured && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <span>
              {t('page.reporter.search_disabled_prefix')}{' '}
              <code className="font-mono">VITE_MAPBOX_TOKEN</code>{' '}
              {t('page.reporter.search_disabled_suffix')}
            </span>
          </div>
        )}

        <div className="max-w-xl mb-8">
          <AddressSearch
            autoFocus={!params}
            initialValue={params?.address ?? ''}
            onSelect={(r) => {
              void signal.send('Search for Address', {
                address: r.label,
                lat: r.lat,
                lng: r.lng,
              });
              const qs = new URLSearchParams({
                lat: r.lat.toFixed(6),
                lng: r.lng.toFixed(6),
                q: r.label,
              });
              navigate(`/reporter?${qs.toString()}`);
            }}
          />
        </div>

        {params && (
          <>
            <div className="surface rounded-xl px-4 sm:px-5 py-4 mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-gray-100">
                  <MapPin size={15} className="text-cyan-400 flex-shrink-0" />
                  <span className="text-sm font-semibold truncate">
                    {params.address || t('page.reporter.selected_location')}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500 font-mono">
                  {params.lat.toFixed(6)}, {params.lng.toFixed(6)}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={regenerate}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold border border-white/10 text-gray-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-colors"
                >
                  <RefreshCw size={13} />
                  {t('page.reporter.regenerate')}
                </button>
                <button
                  type="button"
                  onClick={openReport}
                  disabled={selectedCount === 0}
                  title={
                    selectedCount === 0
                      ? t('page.reporter.report.select_at_least_one')
                      : t('page.reporter.report.generate_tooltip', { n: selectedCount })
                  }
                  className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-semibold transition-colors ${
                    selectedCount === 0
                      ? 'cursor-not-allowed border border-white/5 bg-white/[0.02] text-gray-600'
                      : 'border border-cyan-400/40 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25 hover:border-cyan-300/60'
                  }`}
                >
                  <FileDown size={13} />
                  {t('page.reporter.report.generate')}
                  <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-md bg-cyan-400/20 px-1.5 text-[10px] font-bold tabular-nums">
                    {selectedCount}
                  </span>
                </button>
              </div>
            </div>

            {liveSelectedCount === 0 && selectedCount > 0 && (
              <div className="mb-4 -mt-2 text-[11px] text-gray-500">
                {t('page.reporter.report.waiting_for_data')}
              </div>
            )}

            <ReportGrid
              key={`${params.lat},${params.lng},${regenKey}`}
              lat={params.lat}
              lng={params.lng}
              selection={selection}
              onToggleSelect={toggleSelect}
              onReport={handleReport}
            />

            <ParcelInfoStrip
              lat={params.lat}
              lng={params.lng}
              address={params.address}
              onLoaded={handleParcel}
            />

            <ReportDialog
              open={reportOpen}
              onClose={() => setReportOpen(false)}
              lat={params.lat}
              lng={params.lng}
              address={params.address}
              parcel={parcel}
              selection={selection}
              rawByWidget={rawByWidget}
            />

            {/* Claire grounds on the resolved parcel + the live report metrics,
                so users can ask her to explain the report. Gated on a resolved
                parcel so she always has real context to work from. */}
            {parcel && (
              <ReporterClaire
                lat={params.lat}
                lng={params.lng}
                address={params.address}
                parcel={parcel}
                rawByWidget={rawByWidget}
              />
            )}
          </>
        )}

        {!params && (
          <div className="surface rounded-xl px-6 py-12 text-center">
            <FileBarChart size={28} className="mx-auto text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">
              {t('page.reporter.no_report')}
            </p>
          </div>
        )}
      </main>
    </>
  );
}
