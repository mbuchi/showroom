import { Hash, MapPin, Calendar, Maximize2, Layers, Globe } from 'lucide-react';
import type { SavedImage } from '../../services/imageService';
import { APP_LABELS } from '../../services/imageService';
import {
  formatDate,
  formatBytes,
  formatCoord,
  formatDeg,
} from '../../lib/format';
import { useI18n } from '../../contexts/I18nContext';

const KNOWN_META_KEYS = new Set([
  'url',
  'viewport',
  'captured_at',
  'central_lat',
  'central_lng',
  'central_parcel_id',
  'tilt_degree',
  'bearing_degree',
  'zoom',
  'address',
  'basemap',
  'is_3d_mode',
]);

interface MetadataPanelProps {
  image: SavedImage;
}

export default function MetadataPanel({ image }: MetadataPanelProps) {
  const { t } = useI18n();
  const meta = image.custom_metadata || {};
  const lat = formatCoord(meta.central_lat);
  const lng = formatCoord(meta.central_lng);
  const tilt = formatDeg(meta.tilt_degree);
  const bearing = formatDeg(meta.bearing_degree);
  const zoom = typeof meta.zoom === 'number' ? meta.zoom.toFixed(1) : null;
  const parcelId = image.prm_id || meta.central_parcel_id;

  const extras = Object.entries(meta).filter(
    ([k, v]) => !KNOWN_META_KEYS.has(k) && v !== null && v !== undefined && v !== ''
  );

  return (
    <div className="text-xs text-gray-200">
      <div className="px-4 py-3 border-b border-white/5">
        <h3 className="text-sm font-semibold text-gray-100 break-all leading-snug">
          {image.original_filename}
        </h3>
        <p className="mt-1 text-[11px] text-gray-500">
          {APP_LABELS[image.app_source] || image.app_source}
        </p>
      </div>

      {(meta.address || parcelId || (lat && lng)) && (
        <Section title={t('modal.detail.section_location')}>
          {meta.address && (
            <Row icon={<MapPin size={11} aria-hidden="true" />} label={t('modal.detail.label_address')} value={meta.address} />
          )}
          {parcelId && (
            <Row
              icon={<Hash size={11} aria-hidden="true" />}
              label={t('modal.detail.label_parcel_id')}
              value={String(parcelId)}
              mono
            />
          )}
          {lat && lng && (
            <Row icon={<Globe size={11} aria-hidden="true" />} label={t('modal.detail.label_center')} value={`${lat}, ${lng}`} mono />
          )}
        </Section>
      )}

      <Section title={t('modal.detail.section_capture')}>
        <Row icon={<Calendar size={11} aria-hidden="true" />} label={t('modal.detail.label_saved')} value={formatDate(image.created_at)} />
        <Row
          icon={<Maximize2 size={11} aria-hidden="true" />}
          label={t('modal.detail.label_dimensions')}
          value={`${image.width} × ${image.height}`}
          mono
        />
        <Row
          icon={<Layers size={11} aria-hidden="true" />}
          label={t('modal.detail.label_size')}
          value={formatBytes(image.file_size)}
          mono
        />
        {zoom && <Row label={t('modal.detail.label_zoom')} value={zoom} mono />}
        {tilt && <Row label={t('modal.detail.label_tilt')} value={tilt} mono />}
        {bearing && <Row label={t('modal.detail.label_bearing')} value={bearing} mono />}
        {meta.basemap && <Row label={t('modal.detail.label_basemap')} value={String(meta.basemap)} />}
        {typeof meta.is_3d_mode === 'boolean' && (
          <Row
            label={t('modal.detail.label_3d_mode')}
            value={meta.is_3d_mode ? t('modal.detail.value_on') : t('modal.detail.value_off')}
          />
        )}
      </Section>

      {extras.length > 0 && (
        <Section title={t('modal.detail.section_additional')}>
          {extras.map(([k, v]) => (
            <Row
              key={k}
              label={k}
              value={typeof v === 'object' ? JSON.stringify(v) : String(v)}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 border-b border-white/5 last:border-b-0">
      <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-gray-500 mb-2">
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  mono,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-3 items-baseline">
      <span className="w-24 flex-shrink-0 text-gray-500 inline-flex items-center gap-1.5">
        {icon}
        <span className="capitalize">{label}</span>
      </span>
      <span
        className={`flex-1 break-words text-gray-200 ${mono ? 'font-mono text-[11px]' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}
