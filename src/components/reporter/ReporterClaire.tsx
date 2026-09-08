import { useMemo } from 'react';
import { ClaireAssistant } from '@aireon/shared';
import { useI18n } from '../../contexts/I18nContext';
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
 * `locale` carries showroom's own UI language to Claire's status copy (today
 * the thinking indicator that shared v1.213.0 added). The prop is optional and
 * falls back to `<html lang>`, but showroom's language lives in I18nContext
 * rather than in a shared `createI18n` instance, so nothing here used to write
 * that attribute and every non-English user got an English status line under a
 * translated UI. Passing it explicitly is the direct fix; I18nProvider now also
 * keeps `<html lang>` in step, which fixes screen-reader pronunciation.
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
  // showroom's Locale is the shared 'de' | 'en' | 'fr' | 'it' union, which is
  // exactly ClaireThinkingLocale, so this needs no narrowing or cast.
  const { locale } = useI18n();

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
      // The resolved zone (municipal designation via the shared resolver;
      // see parcelInfo.ts). Sent under `construction_zone`, a key Claire's
      // context labeller knows; the former `cz_abbrev`/`zone` keys were not in
      // its label map, so the zone never reached the prompt.
      construction_zone: parcel.zone ?? undefined,
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
    // data-tour scopes the guided tour's Claire step to this subtree; the step
    // targets the launcher button inside (the wrapper itself has no box).
    <div data-screenshot-ignore="true" data-tour="claire">
      <ClaireAssistant
        appName="showroom"
        voiceCallEnabled
        properties={properties}
        enrichment={enrichment}
        lngLat={{ lng, lat }}
        headerAddress={headerAddress}
        locale={locale}
      />
    </div>
  );
}
