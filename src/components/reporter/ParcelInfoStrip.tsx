import { useEffect, useState, type ReactNode } from 'react';
import {
  MapPin, Fingerprint, Ruler, Box, Building2, Map as MapIcon, Crosshair,
  Bookmark, BookmarkCheck, ExternalLink, Loader2,
} from 'lucide-react';
import {
  Skeleton,
  createPrmRecord,
  fetchPrmByParcel,
  PROOM_APP_URL,
  PrmAuthRequiredError as AuthRequiredError,
  type PrmRecord,
} from '@aireon/shared';
import { fetchParcelInfo, type ParcelInfo } from '../../lib/parcelInfo';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../auth/AuthContext';

// Parcel-context strip rendered below the reporter cards: a wrapping row of
// chips with the general facts of the parcel at the searched location.
// Self-fetching; degrades quietly to a one-line notice if the RES API is
// unavailable so it never blocks the report above it.

interface ParcelInfoStripProps {
  lat: number;
  lng: number;
  /** Searched address from the URL query — used as the saved-parcel label
   *  when present, falling back to formatted coordinates otherwise. */
  address?: string | null;
  /** Bubble the fetched parcel up to ReporterView so the PDF report can embed
   *  it without paying for a second /api/parcel-data request. Fires once per
   *  load, with `null` on failure. */
  onLoaded?: (info: ParcelInfo | null) => void;
}

type State =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ok'; info: ParcelInfo };

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function Chip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-white/10 bg-white/5 text-xs text-gray-200">
      <span className="text-cyan-400 flex-shrink-0">{icon}</span>
      <span className="tabular-nums">{children}</span>
    </span>
  );
}

function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export default function ParcelInfoStrip({ lat, lng, address, onLoaded }: ParcelInfoStripProps) {
  const { t } = useI18n();
  const { getAccessToken, isAuthenticated } = useAuth();
  const accessToken = isAuthenticated ? getAccessToken() ?? null : null;
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [savedRecord, setSavedRecord] = useState<PrmRecord | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setState({ kind: 'loading' });
    fetchParcelInfo(lat, lng, ctrl.signal)
      .then((info) => {
        if (ctrl.signal.aborted) return;
        setState(info ? { kind: 'ok' as const, info } : { kind: 'error' as const });
        onLoaded?.(info);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) {
          setState({ kind: 'error' });
          onLoaded?.(null);
        }
      });
    return () => ctrl.abort();
  }, [lat, lng, onLoaded]);

  // Reset save state when the parcel changes, then check whether this parcel
  // is already saved by the current user so the button shows "Saved" on load.
  const parcelId = state.kind === 'ok' ? state.info.egrid : null;
  useEffect(() => {
    setSaveStatus('idle');
    setSavedRecord(null);
    if (!parcelId || !isAuthenticated || !accessToken) return;
    let cancelled = false;
    fetchPrmByParcel(accessToken, parcelId)
      .then((record) => {
        if (cancelled) return;
        if (record) {
          setSavedRecord(record);
          setSaveStatus('saved');
        }
      })
      .catch(() => {
        /* silent — leave as idle */
      });
    return () => {
      cancelled = true;
    };
  }, [parcelId, isAuthenticated, accessToken]);

  const handleSave = async () => {
    if (state.kind !== 'ok' || !state.info.egrid) return;
    if (!isAuthenticated || !accessToken) {
      setSaveStatus('error');
      return;
    }
    const info = state.info;
    setSaveStatus('saving');
    try {
      const record = await createPrmRecord(accessToken, {
        parcel_id: info.egrid!,
        parcel_label: address?.trim() || formatCoords(lat, lng),
        parcel_municipality: info.locality ?? '',
        parcel_area: info.buildingSizeM2 ?? 0,
        parcel_lng: lng,
        parcel_lat: lat,
      });
      setSavedRecord(record);
      setSaveStatus('saved');
    } catch (err) {
      if (err instanceof AuthRequiredError) {
        setSaveStatus('error');
        return;
      }
      console.error('PRM save failed', err);
      setSaveStatus('error');
    }
  };

  if (state.kind === 'loading') {
    return (
      <div className="surface rounded-xl px-4 py-3 mt-6 flex flex-wrap items-center gap-2">
        {[72, 88, 64, 80, 56, 76].map((w, i) => (
          <Skeleton key={i} width={w} height={28} radius={8} delay={`${i * 60}ms`} />
        ))}
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div className="surface rounded-xl px-4 py-3 mt-6 text-xs text-gray-500">
        {t('page.reporter.parcel_unavailable')}
      </div>
    );
  }

  const { info } = state;
  const fmt = (n: number) => n.toLocaleString('de-CH');

  return (
    <div className="surface rounded-xl px-4 py-3 mt-6 flex flex-wrap items-center gap-2">
      {info.address && (
        <Chip icon={<MapPin size={13} />}>
          {[info.address, info.locality].filter(Boolean).join(', ')}
        </Chip>
      )}
      {!info.address && info.locality && (
        <Chip icon={<MapPin size={13} />}>{info.locality}</Chip>
      )}
      {info.egrid && <Chip icon={<Fingerprint size={13} />}>{info.egrid}</Chip>}
      {info.egrid && (
        <SavePrmControl
          saveStatus={saveStatus}
          savedRecord={savedRecord}
          isAuthenticated={isAuthenticated}
          onSave={handleSave}
          t={t}
        />
      )}
      {info.buildingSizeM2 != null && (
        <Chip icon={<Ruler size={13} />}>{fmt(info.buildingSizeM2)} m²</Chip>
      )}
      {info.buildingVolumeM3 != null && (
        <Chip icon={<Box size={13} />}>{fmt(info.buildingVolumeM3)} m³</Chip>
      )}
      {info.flats != null && (
        <Chip icon={<Building2 size={13} />}>
          {info.flats} {info.flats === 1 ? t('page.reporter.flats_one') : t('page.reporter.flats_other')}
        </Chip>
      )}
      {info.zone && <Chip icon={<MapIcon size={13} />}>{info.zone}</Chip>}
      <Chip icon={<Crosshair size={13} />}>
        {info.lat.toFixed(6)}, {info.lng.toFixed(6)}
      </Chip>
    </div>
  );
}

interface SavePrmControlProps {
  saveStatus: SaveStatus;
  savedRecord: PrmRecord | null;
  isAuthenticated: boolean;
  onSave: () => void;
  t: (key: string) => string;
}

// Save-to-PRM button (and "open in proom" external link once saved), styled
// to sit alongside the existing egrid chip on the parcel strip.
function SavePrmControl({
  saveStatus,
  savedRecord,
  isAuthenticated,
  onSave,
  t,
}: SavePrmControlProps) {
  const title =
    !isAuthenticated
      ? t('prm.signin_required')
      : saveStatus === 'saved'
        ? t('prm.saved')
        : saveStatus === 'saving'
          ? t('prm.saving')
          : saveStatus === 'error'
            ? t('prm.save_failed')
            : t('prm.save');

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={onSave}
        disabled={saveStatus === 'saving' || saveStatus === 'saved'}
        title={title}
        aria-label={title}
        className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium border transition-colors disabled:cursor-default ${
          saveStatus === 'saved'
            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
            : saveStatus === 'error'
              ? 'bg-red-500/10 text-red-300 border-red-400/30 hover:bg-red-500/20'
              : saveStatus === 'saving'
                ? 'bg-white/5 text-gray-400 border-white/10'
                : 'bg-cyan-500/15 text-cyan-200 border-cyan-400/30 hover:bg-cyan-500/25'
        }`}
      >
        {saveStatus === 'saving' ? (
          <>
            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
            <span>{t('prm.saving')}</span>
          </>
        ) : saveStatus === 'saved' ? (
          <>
            <BookmarkCheck size={13} aria-hidden="true" />
            <span>{t('prm.saved')}</span>
          </>
        ) : saveStatus === 'error' && !isAuthenticated ? (
          <>
            <Bookmark size={13} aria-hidden="true" />
            <span>{t('prm.signin_required')}</span>
          </>
        ) : (
          <>
            <Bookmark size={13} aria-hidden="true" />
            <span>{saveStatus === 'error' ? t('prm.save_failed') : t('prm.save')}</span>
          </>
        )}
      </button>
      {saveStatus === 'saved' && savedRecord && (
        <a
          href={`${PROOM_APP_URL}/?prm=${encodeURIComponent(savedRecord.id)}`}
          target="_blank"
          rel="noopener noreferrer"
          title={t('prm.open_in_proom')}
          aria-label={t('prm.open_in_proom')}
          className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:text-cyan-200 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-colors"
        >
          <ExternalLink size={13} />
        </a>
      )}
    </span>
  );
}
