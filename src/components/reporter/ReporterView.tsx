import { useEffect, useState } from 'react';
import { MapPin, RefreshCw, AlertTriangle, FileBarChart } from 'lucide-react';
import Navbar from '../Navbar';
import { ReleaseNotesButton } from '@swissnovo/shared';
import { RELEASES, REPO_URL } from '../../data/releaseNotes';
import AddressSearch from './AddressSearch';
import ReportGrid from './ReportGrid';
import { navigate, useRoute } from '../../lib/router';
import { isGeocodingConfigured } from '../../lib/geocode';
import { sendAddressSearchSignal } from '../../services/signalService';

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

export default function ReporterView() {
  const { search } = useRoute();
  const params = parseParams(search);

  // Bumped by "Regenerate" — remounts the widget grid for a fresh capture.
  const [regenKey, setRegenKey] = useState(0);

  // Reset the regen counter whenever a new location is searched.
  useEffect(() => {
    setRegenKey(0);
  }, [params?.lat, params?.lng]);

  return (
    <>
      <Navbar
        showSearch={false}
        rightSlot={
          <ReleaseNotesButton
            releases={RELEASES}
            repoUrl={REPO_URL}
            storageKey="showroom:lastSeenReleaseVersion"
            brandPrefix="showr"
            brandSuffix="m"
          />
        }
      />

      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-cyan-400 mb-1.5">
            <FileBarChart size={16} />
            <h1 className="text-sm uppercase tracking-[0.18em] font-bold">Reporter</h1>
          </div>
          <p className="text-sm text-gray-400 max-w-2xl">
            Enter an address to generate a standardized showroom report — live
            map widgets recreating five SwissNovo apps at that location:
            valuation, building height, construction year, solar potential and
            noise exposure.
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
              void sendAddressSearchSignal({
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
                    {params.address || 'Selected location'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500 font-mono">
                  {params.lat.toFixed(6)}, {params.lng.toFixed(6)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRegenKey((k) => k + 1)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border border-white/10 text-gray-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-colors"
              >
                <RefreshCw size={13} />
                Regenerate
              </button>
            </div>

            <ReportGrid
              key={`${params.lat},${params.lng},${regenKey}`}
              lat={params.lat}
              lng={params.lng}
            />
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
