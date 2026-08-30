import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Send } from 'lucide-react';
import { AddressSearch } from '@aireon/shared';
import Navbar from '../Navbar';
import ListingForm from './ListingForm';
import PrefillSummary from './PrefillSummary';
import DwellingPicker from './DwellingPicker';
import ImagePicker from './ImagePicker';
import ValidationPanel from './ValidationPanel';
import ExportPanel from './ExportPanel';
import PortalGuide from './PortalGuide';
import { usePublishDraft } from './usePublishDraft';
import { useRoute } from '../../lib/router';
import { signal } from '../../lib/signal';
import { useI18n } from '../../contexts/I18nContext';
import { validateDraft } from '../../lib/idx/validate';
import { buildSearchLabels } from '../../lib/searchLabels';
import type { GeocodeResult } from '../../lib/geocode';

interface DeepLink {
  lat: number;
  lng: number;
  address: string | null;
}

/** `?lat=&lng=` deep link, range-validated exactly like the reporter's. */
function parseParams(search: string): DeepLink | null {
  const p = new URLSearchParams(search);
  const lat = Number.parseFloat(p.get('lat') ?? '');
  const lng = Number.parseFloat(p.get('lng') ?? '');
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng, address: p.get('q') };
}

/**
 * Portal publisher: turns a property into an IDX 3.01 upload package for the
 * Swiss portals. The left column is the draft (address prefill, listing form,
 * image picker); the sticky right rail is live validation, the export actions
 * and the per-portal upload guide.
 */
export default function PublishView() {
  const { t, locale } = useI18n();
  const { search } = useRoute();
  const {
    draft,
    patch,
    patchFeature,
    setImages,
    reset,
    prefillFromLocation,
    prefillState,
    prefillResult,
    gwrDwellings,
    selectedDwellingEwid,
    selectDwelling,
  } = usePublishDraft();

  const issues = useMemo(() => validateDraft(draft), [draft]);
  const errorFields = useMemo(
    () => new Set(issues.filter((i) => i.severity === 'error').map((i) => i.field)),
    [issues],
  );

  // Deep link: prefill once per coordinate pair so a re-render (or a later
  // manual edit of the same fields) never re-runs the parcel lookup.
  const deepLink = useMemo(() => parseParams(search), [search]);
  const prefilledRef = useRef<string | null>(null);
  useEffect(() => {
    if (!deepLink) return;
    const key = `${deepLink.lat},${deepLink.lng}`;
    if (prefilledRef.current === key) return;
    prefilledRef.current = key;
    void prefillFromLocation(deepLink.lat, deepLink.lng, deepLink.address ?? '');
  }, [deepLink, prefillFromLocation]);

  // Surfaces the shared AddressSearch's onError in the same spot/styling the
  // retired bespoke box used to render its own inline fetch failures.
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSelectAddress = useCallback(
    (result: GeocodeResult) => {
      setSearchError(null);
      void signal.send('Search for Address', {
        address: result.label,
        lat: result.lat,
        lng: result.lng,
      });
      void prefillFromLocation(result.lat, result.lng, result.label);
    },
    [prefillFromLocation],
  );

  const handleSearchError = useCallback(
    (err: unknown) => {
      setSearchError(err instanceof Error ? err.message : t('page.reporter.search_error_fallback'));
    },
    [t],
  );

  const searchLabels = useMemo(() => buildSearchLabels(t), [t]);

  // Two-tap reset — the suite forbids native confirm(). The armed state
  // disarms itself after 3 s so a stray first click cannot linger.
  const [confirmReset, setConfirmReset] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(
    () => () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    },
    [],
  );
  const handleReset = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    if (confirmReset) {
      setConfirmReset(false);
      prefilledRef.current = null;
      reset();
      return;
    }
    setConfirmReset(true);
    resetTimerRef.current = setTimeout(() => setConfirmReset(false), 3000);
  }, [confirmReset, reset]);

  return (
    <>
      <Navbar showSearch={false} />

      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2 text-cyan-400">
              <Send size={16} aria-hidden="true" />
              <h1 className="text-sm font-bold uppercase tracking-[0.18em]">
                {t('page.publish.kicker')}
              </h1>
            </div>
            <p className="max-w-2xl text-sm text-gray-400">{t('page.publish.intro')}</p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors focus-ring ${
              confirmReset
                ? 'border-red-400/50 bg-red-500/15 text-red-200'
                : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-200'
            }`}
          >
            <RotateCcw size={13} aria-hidden="true" />
            {confirmReset ? t('page.publish.reset.confirm') : t('page.publish.reset')}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0 space-y-4">
            <section className="surface rounded-2xl p-4 sm:p-5">
              <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {t('page.publish.prefill.title')}
              </h2>
              <AddressSearch
                dark
                locale={locale}
                labels={searchLabels}
                history
                appName="showroom"
                maxRecent={6}
                onSelect={handleSelectAddress}
                onError={handleSearchError}
              />
              {searchError && <p className="mt-1.5 text-xs text-red-400">{searchError}</p>}
              {prefillState === 'idle' ? (
                <p className="mt-2.5 text-xs leading-snug text-gray-500">
                  {t('page.publish.prefill.hint')}
                </p>
              ) : (
                <PrefillSummary state={prefillState} result={prefillResult} />
              )}
              {/* Only rendered when the register lists several units in the
                  building — one unit is filled automatically. */}
              <DwellingPicker
                dwellings={gwrDwellings}
                selectedEwid={selectedDwellingEwid}
                onSelect={selectDwelling}
              />
            </section>

            <div data-tour="publish-form">
              <ListingForm
                draft={draft}
                patch={patch}
                patchFeature={patchFeature}
                errorFields={errorFields}
                pricePerM2Living={prefillResult?.pricePerM2Living ?? null}
                zone={prefillResult?.zone ?? null}
                buildingCount={prefillResult?.buildingCount ?? null}
              />
            </div>

            <div data-tour="publish-images">
              <ImagePicker images={draft.images} onChange={setImages} />
            </div>
          </div>

          <div className="space-y-4 self-start lg:sticky lg:top-20">
            <ValidationPanel issues={issues} />
            <div data-tour="publish-export">
              <ExportPanel draft={draft} issues={issues} />
            </div>
            <PortalGuide />
          </div>
        </div>
      </main>
    </>
  );
}
