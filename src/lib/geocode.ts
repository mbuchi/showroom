// Address geocoding — resolves a free-text Swiss address to coordinates so the
// reporter can deep-link every map-first app at the same point.
//
// Backed by the suite-shared geo.admin.ch SearchServer geocoder
// (`searchGeoAdminAddresses`): tokenless, CORS-open, Swiss-only, authoritative
// federal addresses, with its own IndexedDB front-of-cache. No external
// geocoding token is required.

import { searchGeoAdminAddresses } from '@aireon/shared';

// geo.admin needs no API key, so address search is always available.
export const isGeocodingConfigured = true;

// Result shape consumed by AddressSearch / ReporterView. Matches the shared
// geo.admin result contract exactly ({ id, label, lat, lng } with numeric
// lat/lng), so selections flow through unchanged. `kind`/`egrid` are set on
// RES parcel (EGRID) hits merged in by the address box; address results leave
// them undefined so the existing address flow is untouched.
export interface GeocodeResult {
  id: string;
  label: string;
  lat: number;
  lng: number;
  kind?: 'address' | 'parcel';
  egrid?: string;
}

export async function geocodeAddress(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  const results = await searchGeoAdminAddresses(query, { signal });
  return results.map((r) => ({
    id: r.id,
    label: r.label,
    lat: r.lat,
    lng: r.lng,
  }));
}
