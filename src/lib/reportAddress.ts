// The address the reporter DISPLAYS for a location.
//
// Never the `?q=` text from the URL: that is a label somebody else attached to
// the point, and it can be wrong (see reportParams.ts). Never a coordinate
// reverse geocode either — at the Embrach coordinate from the original report
// the nearest register entrance is "Alte Rheinstrasse 91.1" at 5.9 m, the
// garage sharing the plot rather than a postal address, and widening the radius
// only brings a neighbour's address into range. Over 71 sampled parcels a point
// lookup named an address on a DIFFERENT parcel in 92% of cases.
//
// The right question is "what is this parcel's address?", so the answer is
// keyed off the parcel's identity:
//
//   1. The parcel showroom already fetched from RES (`/api/parcel-data` returns
//      the parcel under the point, with its EGRID and stored address). Handed to
//      the shared resolver, which upgrades an annex number to its stem via the
//      building register and falls back to the register when the parcel has no
//      stored address. The common case costs no request at all.
//   2. Only when RES gave us nothing: the shared coordinate path, which
//      identifies the parcel under the point in the federal cadastre first and
//      then asks that parcel.
//
// See aireon-shared/docs/PARCEL_ADDRESS_STANDARD.md.

import {
  resolveAddressAtPoint,
  resolveParcelAddress,
  type ParcelAddressResolution,
} from '@aireon/shared/geoadmin';
import type { ParcelInfo } from './parcelInfo';

export type { ParcelAddressResolution };

/**
 * Resolve the display address for a reporter location.
 *
 * `parcel` is the RES lookup for the same point, or null when it failed or
 * found nothing. Never throws — resolves null when nothing could be determined,
 * in which case the caller keeps showing the URL hint (better than blank).
 */
export async function resolveReportAddress(
  lat: number,
  lng: number,
  parcel: ParcelInfo | null,
  signal?: AbortSignal,
): Promise<ParcelAddressResolution | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  try {
    if (parcel?.egrid) {
      // Feed the resolver the parcel's stored fields under the tile-property
      // names it reads, so an already-good address answers with no request.
      return await resolveParcelAddress({
        egrid: parcel.egrid,
        properties: {
          address: parcel.address,
          zip: parcel.zip,
          cityname: parcel.city,
        },
        lat,
        lng,
        signal,
      });
    }
    return await resolveAddressAtPoint(lat, lng, { signal });
  } catch {
    // Best effort: the banner keeps the hint rather than going blank.
    return null;
  }
}

/**
 * The label stored on a saved-parcel (PRM) record.
 *
 * The record is keyed by EGRID, so its label must describe THAT parcel: the
 * resolved register address first, the parcel's own stored address next, and
 * coordinates only when the register knows neither. The `?q=` text never gets a
 * look in — it used to, which is how a link carrying "Alte Rheinstrasse 87"
 * wrote number 87 onto a record for the parcel at number 91, permanently.
 */
export function prmLabel(
  info: Pick<ParcelInfo, 'address' | 'locality'>,
  resolvedAddress: ParcelAddressResolution | null | undefined,
  lat: number,
  lng: number,
): string {
  const resolved = resolvedAddress?.label?.trim();
  if (resolved) return resolved;
  const own = [info.address, info.locality]
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .join(' ')
    .trim();
  if (own) return own;
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
