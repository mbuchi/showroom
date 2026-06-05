// Mapbox geocoding — resolves a free-text Swiss address to coordinates so the
// reporter can deep-link every map-first app at the same point.

import { IndexedDBCache } from '@aireon/shared';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

export const isGeocodingConfigured = !!TOKEN;

// Client-side cache for geocoding queries. Address search fires the same
// queries over and over — both as the user types and across repeat searches —
// so caching the parsed results keyed by the normalized query makes a
// previously seen search resolve with zero network latency and avoids burning
// Mapbox quota on duplicates.
//
// Suite front-of-cache convention (see feedback-redis-backend-cache): this is
// the per-user hot cache in front of the upstream API. Geocode results are
// stable, so a 30-day TTL is safe; a small LRU byte budget keeps the store
// bounded. Every IDB failure path inside IndexedDBCache is silent, so a
// broken/blocked IndexedDB degrades gracefully to a plain network fetch.
const GEOCODE_CACHE_TTL_MINUTES = 30 * 24 * 60; // 30 days
const GEOCODE_CACHE_MAX_BYTES = 1 * 1024 * 1024; // 1 MB
const geocodeCache = new IndexedDBCache<GeocodeResult[]>('showroom-geocode', 'forward', {
  ttlMinutes: GEOCODE_CACHE_TTL_MINUTES,
  maxBytes: GEOCODE_CACHE_MAX_BYTES,
});

export interface GeocodeResult {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

interface MapboxFeature {
  id?: string | number;
  properties?: { full_address?: string; name?: string };
  geometry?: { coordinates?: number[] };
}

export async function geocodeAddress(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  if (!TOKEN) throw new Error('VITE_MAPBOX_TOKEN is not set');
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const key = trimmed.toLowerCase();
  const cached = await geocodeCache.get(key);
  if (cached) return cached;
  // A cache lookup is async; bail out if the caller aborted while we waited.
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const url = new URL('https://api.mapbox.com/search/geocode/v6/forward');
  url.searchParams.set('q', trimmed);
  url.searchParams.set('country', 'ch');
  url.searchParams.set('limit', '5');
  url.searchParams.set('types', 'address,street,place');
  url.searchParams.set('access_token', TOKEN);

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const data = (await res.json()) as { features?: MapboxFeature[] };

  const results = (data.features ?? [])
    .map((f): GeocodeResult | null => {
      const coords = f?.geometry?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) return null;
      const [lng, lat] = coords;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        id: String(f.id ?? `${lat},${lng}`),
        label: f.properties?.full_address || f.properties?.name || `${lat}, ${lng}`,
        lat,
        lng,
      };
    })
    .filter((r): r is GeocodeResult => r !== null);

  // Cache successful responses, including empty ("no matches") results so a
  // repeated dead-end query is also a zero-network resolve. set() never throws,
  // so this stays out of the caller's error path.
  await geocodeCache.set(key, results);

  return results;
}
