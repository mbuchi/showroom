import { useEffect, useState, type ReactNode } from 'react';
import {
  MapPin, Fingerprint, Ruler, Box, Building2, Map as MapIcon, Crosshair,
} from 'lucide-react';
import { Skeleton } from '@swissnovo/shared';
import { fetchParcelInfo, type ParcelInfo } from '../../lib/parcelInfo';
import { useI18n } from '../../contexts/I18nContext';

// Parcel-context strip rendered below the reporter cards: a wrapping row of
// chips with the general facts of the parcel at the searched location.
// Self-fetching; degrades quietly to a one-line notice if the RES API is
// unavailable so it never blocks the report above it.

interface ParcelInfoStripProps {
  lat: number;
  lng: number;
}

type State =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ok'; info: ParcelInfo };

function Chip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-white/10 bg-white/5 text-xs text-gray-200">
      <span className="text-cyan-400 flex-shrink-0">{icon}</span>
      <span className="tabular-nums">{children}</span>
    </span>
  );
}

export default function ParcelInfoStrip({ lat, lng }: ParcelInfoStripProps) {
  const { t } = useI18n();
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    const ctrl = new AbortController();
    setState({ kind: 'loading' });
    fetchParcelInfo(lat, lng, ctrl.signal)
      .then((info) => {
        if (ctrl.signal.aborted) return;
        setState(info ? { kind: 'ok', info } : { kind: 'error' });
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setState({ kind: 'error' });
      });
    return () => ctrl.abort();
  }, [lat, lng]);

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
