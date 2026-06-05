// Parcel-level data lookups for the reporter widgets.
//
// Valoo and Roofs read the price / height attributes straight off the Mapbox
// `parcel_2025_07` vector tiles (extractParcelStats). Roots has no Mapbox map,
// so its construction-year stat comes from a GeoServer GetFeatureInfo call.

import { IndexedDBCache } from '@aireon/shared';

export interface ParcelStats {
  priceM2: number | null;     // estimated_price_m2, CHF/m²
  heightMax: number | null;   // bldg_height_max, m
  heightMin: number | null;   // bldg_height_min, m
}

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : null;
}

/** Normalise a Mapbox parcel feature's `properties` into typed stats. */
export function extractParcelStats(props: Record<string, unknown>): ParcelStats {
  const price = num(props.estimated_price_m2);
  const hMax = num(props.bldg_height_max);
  const hMin = num(props.bldg_height_min);
  return {
    priceM2: price === null ? null : Math.round(price),
    heightMax: hMax === null ? null : Math.round(hMax * 10) / 10,
    heightMin: hMin === null ? null : Math.round(hMin * 10) / 10,
  };
}

// Construction-year property keys on `project_res:parcel_2025_07`, confirmed
// against a live GetFeatureInfo response (2026-05-18). `bldg_constr_year` is
// the building's year; `cy_max` is the parcel-aggregate fallback.
const YEAR_KEYS = ['bldg_constr_year', 'cy_max', 'cy_avg'];
const GEOSERVER_WMS = 'https://gs-contabo-extra.zeroo.ch/geoserver/project_res/wms';

// Two-layer client cache for the construction-year lookup. A synchronous
// in-memory Map fronts an IndexedDBCache so a repeat lookup at the same point
// resolves instantly instead of re-hitting GeoServer. This is the per-user hot
// cache in front of the backend (see feedback-redis-backend-cache). The
// construction year is effectively immutable, so a 30-day TTL is generous and
// a tiny LRU budget keeps the store bounded. We wrap the result in `{ year }`
// so a cached "no year" (null) is distinguishable from a cache miss. Every IDB
// failure path inside IndexedDBCache is silent, so a broken/blocked IndexedDB
// degrades gracefully to a plain network fetch.
const YEAR_CACHE_TTL_MINUTES = 30 * 24 * 60; // 30 days
const YEAR_CACHE_MAX_BYTES = 1 * 1024 * 1024; // 1 MB

const yearMemoryCache = new Map<string, number | null>();
const yearPersistentCache = new IndexedDBCache<{ year: number | null }>(
  'showroom-construction',
  'year',
  { ttlMinutes: YEAR_CACHE_TTL_MINUTES, maxBytes: YEAR_CACHE_MAX_BYTES },
);

/** Quantised coordinate key — ~0.1 m precision, enough to collapse repeat
 *  lookups at the same point without bleeding across parcels. */
function yearCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

/**
 * GeoServer GetFeatureInfo for the construction year at a point.
 * Returns null on any failure or if no year is present.
 */
export async function fetchConstructionYear(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<number | null> {
  const key = yearCacheKey(lat, lng);

  // Layer 1 — synchronous in-memory hit.
  if (yearMemoryCache.has(key)) return yearMemoryCache.get(key) ?? null;

  // Layer 2 — persistent IndexedDB hit.
  const idbHit = await yearPersistentCache.get(key);
  if (idbHit) {
    yearMemoryCache.set(key, idbHit.year);
    return idbHit.year;
  }

  const d = 0.0008;
  const params = new URLSearchParams({
    SERVICE: 'WMS', VERSION: '1.1.1', REQUEST: 'GetFeatureInfo',
    LAYERS: 'project_res:parcel_2025_07',
    QUERY_LAYERS: 'project_res:parcel_2025_07',
    SRS: 'EPSG:4326',
    BBOX: `${lng - d},${lat - d},${lng + d},${lat + d}`,
    WIDTH: '101', HEIGHT: '101', X: '50', Y: '50',
    INFO_FORMAT: 'application/json', FEATURE_COUNT: '1',
  });
  try {
    const res = await fetch(`${GEOSERVER_WMS}?${params}`, { signal });
    if (!res.ok) return null;
    const json = await res.json();
    const props = (json?.features?.[0]?.properties ?? {}) as Record<string, unknown>;
    const thisYear = new Date().getFullYear();
    let year: number | null = null;
    for (const k of YEAR_KEYS) {
      const y = num(props[k]);
      if (y && y > 1200 && y <= thisYear) {
        year = Math.round(y);
        break;
      }
    }
    // Write through to both layers (including a null "no year" result so a
    // repeat lookup is also a zero-network resolve). set() never throws.
    yearMemoryCache.set(key, year);
    void yearPersistentCache.set(key, { year });
    return year;
  } catch {
    return null;
  }
}
