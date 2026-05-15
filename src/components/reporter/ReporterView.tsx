import { useCallback, useEffect, useState } from 'react';
import { Loader2, MapPin, RefreshCw, AlertTriangle, FileBarChart } from 'lucide-react';
import Navbar from '../Navbar';
import ReleaseNotesButton from '../ReleaseNotesButton';
import AddressSearch from './AddressSearch';
import ReportCard from './ReportCard';
import { navigate, useRoute } from '../../lib/router';
import { isGeocodingConfigured } from '../../lib/geocode';
import { generateReport, type ReporterReport } from '../../services/reporterService';

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

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="surface-raised rounded-xl overflow-hidden">
          <div className="aspect-[16/10] animate-shimmer" />
          <div className="px-3.5 py-3">
            <div className="h-3.5 w-24 rounded animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReporterView() {
  const { search } = useRoute();
  const params = parseParams(search);

  const [report, setReport] = useState<ReporterReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runReport = useCallback((p: ReportParams, refresh: boolean) => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    generateReport({ lat: p.lat, lng: p.lng, address: p.address, refresh, signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setReport(result);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to generate report');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!params) {
      setReport(null);
      return;
    }
    setReport(null);
    return runReport(params, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.lat, params?.lng]);

  return (
    <>
      <Navbar showSearch={false} rightSlot={<ReleaseNotesButton />} />

      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-cyan-400 mb-1.5">
            <FileBarChart size={16} />
            <h1 className="text-sm uppercase tracking-[0.18em] font-bold">Reporter</h1>
          </div>
          <p className="text-sm text-gray-400 max-w-2xl">
            Enter an address to generate a standardized showroom report — a
            side-by-side capture of every map-first SwissNovo app at that
            location.
          </p>
        </div>

        {!isGeocodingConfigured && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <span>
              Address search is disabled — the <code className="font-mono">VITE_MAPBOX_TOKEN</code>{' '}
              environment variable is not set for this deployment.
            </span>
          </div>
        )}

        <div className="max-w-xl mb-8">
          <AddressSearch
            autoFocus={!params}
            initialValue={params?.address ?? ''}
            onSelect={(r) => {
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
                    {params.address || 'Selected location'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500 font-mono">
                  {params.lat.toFixed(6)}, {params.lng.toFixed(6)}
                  {report && (
                    <span className="ml-2 text-gray-600">
                      · generated {new Date(report.generatedAt).toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => runReport(params, true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border border-white/10 text-gray-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                Regenerate
              </button>
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loading && !report && (
              <>
                <p className="mb-4 flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 size={13} className="animate-spin text-cyan-400" />
                  Capturing 8 apps — first run can take up to a minute…
                </p>
                <SkeletonGrid />
              </>
            )}

            {report && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {report.captures.map((capture) => (
                  <ReportCard key={capture.id} capture={capture} />
                ))}
              </div>
            )}
          </>
        )}

        {!params && (
          <div className="surface rounded-xl px-6 py-12 text-center">
            <FileBarChart size={28} className="mx-auto text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">
              No report yet — search for an address above to begin.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
