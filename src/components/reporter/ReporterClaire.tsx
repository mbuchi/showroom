import { useMemo } from 'react';
import { ClaireAssistant } from '@aireon/shared';
import type { ParcelInfo } from '../../lib/parcelInfo';
import { REPORTER_APPS } from '../../lib/reporterApps';
import type { ReporterAppId } from '../../lib/reporterApps';
import type { WidgetReportRaw } from './report/types';

interface ReporterClaireProps {
  lat: number;
  lng: number;
  /** Address from the search query - falls back to the resolved parcel's. */
  address: string | null;
  /** Resolved parcel context (address, EGRID, zone, size, flats). */
  parcel: ParcelInfo;
  /** Latest live metric from each report card, keyed by app id. */
  rawByWidget: Partial<Record<ReporterAppId, WidgetReportRaw>>;
}

/**
 * Mounts the shared Claire assistant on the reporter, grounded on the parcel
 * being reported so a user can ask Claire to explain the report.
 *
 * `properties` carries the parcel's identifying facts (EGRID, address,
 * municipality, zone, footprint, volume, flats); `enrichment` carries the
 * live headline metric from each report card (valuation, building height,
 * construction year, solar potential, road noise) so Claire can answer
 * questions about the numbers on screen. Both feed Claire's prompt server
 * side - no Gemini key is read or bundled client-side (chat routes through
 * the RES proxy).
 *
 * Claire renders its launcher and panel into a body portal, both already
 * tagged `data-screenshot-ignore` by the shared component; the reporter's
 * per-widget capture is scoped to each `.reporter-capture` element, so Claire
 * is never in a snapshot regardless. The wrapper carries the ignore attribute
 * too, as a defensive belt-and-suspenders for any future full-page export.
 */
export default function ReporterClaire({
  lat,
  lng,
  address,
  parcel,
  rawByWidget,
}: ReporterClaireProps) {
  // Parcel identity for Claire's prompt. Municipality is the locality line
  // ("8001 Zürich ZH") when present - Claire reads it for the place name.
  const properties = useMemo<Record<string, unknown>>(() => {
    const headerAddress = parcel.address ?? address ?? undefined;
    return {
      parcel_id: parcel.egrid ?? undefined,
      egrid: parcel.egrid ?? undefined,
      address: headerAddress,
      locality: parcel.locality ?? undefined,
      municipality: parcel.locality ?? undefined,
      cz_abbrev: parcel.zone ?? undefined,
      zone: parcel.zone ?? undefined,
      bldg_size: parcel.buildingSizeM2 ?? undefined,
      building_size_m2: parcel.buildingSizeM2 ?? undefined,
      bldg_vol_sb3dgdb: parcel.buildingVolumeM3 ?? undefined,
      building_volume_m3: parcel.buildingVolumeM3 ?? undefined,
      bldg_flats: parcel.flats ?? undefined,
      flats: parcel.flats ?? undefined,
    };
  }, [parcel, address]);

  // The live report itself - each card's current headline metric, so Claire
  // can explain "the report". Keyed by a readable label per app.
  const enrichment = useMemo<Record<string, unknown>>(() => {
    const out: Record<string, unknown> = { report_source: 'showroom reporter' };
    for (const app of REPORTER_APPS) {
      const raw = rawByWidget[app.id];
      if (raw && raw.status === 'ok' && raw.metricDisplay) {
        out[`${app.id}_${app.blurb.replace(/\s+/g, '_').toLowerCase()}`] =
          raw.metricDisplay;
      }
    }
    return out;
  }, [rawByWidget]);

  const headerAddress = parcel.address ?? address ?? undefined;

  return (
    <div data-screenshot-ignore="true">
      <ClaireAssistant
        appName="showroom"
        voiceCallEnabled
        properties={properties}
        enrichment={enrichment}
        lngLat={{ lng, lat }}
        headerAddress={headerAddress}
      />
    </div>
  );
}
