// Parcel-level context for the reporter — the general facts about the parcel
// at a searched location (address, EGRID, size, flats, zone, coordinates).
//
// The RES `parcel_data` endpoint needs a server-side token, so the request is
// proxied through the /api/parcel-data Vercel edge function.

import { IndexedDBCache } from '@aireon/shared';

const PARCEL_ENDPOINT = '/api/parcel-data';

// Two-layer client cache for parcel context. A synchronous in-memory Map fronts
// an IndexedDBCache so the FIRST lookup of a previously-seen location after a
// reload is instant instead of a multi-second RES round-trip. This is the
// per-user hot cache in front of RES (which has its own Redis layer — see
// feedback-redis-backend-cache). Parcel facts change at most monthly, so a
// 14-day TTL is safe; an LRU byte budget keeps the store bounded. Every IDB
// failure path inside IndexedDBCache is silent, so a broken/blocked IndexedDB
// degrades gracefully to a plain network fetch.
const PARCEL_CACHE_TTL_MINUTES = 14 * 24 * 60; // 14 days
const PARCEL_CACHE_MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const memoryCache = new Map<string, ParcelInfo>();
const persistentCache = new IndexedDBCache<ParcelInfo>('showroom-parcel', 'info', {
  ttlMinutes: PARCEL_CACHE_TTL_MINUTES,
  maxBytes: PARCEL_CACHE_MAX_BYTES,
});

/** Quantised coordinate key — ~0.1 m precision, enough to collapse repeat
 *  lookups at the same searched point without bleeding across parcels. */
function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export interface ParcelInfo {
  address: string | null;          // street line, e.g. "Bahnhofstrasse 1"
  locality: string | null;         // "8001 Zürich ZH"
  egrid: string | null;            // parcel_id
  buildingSizeM2: number | null;   // bldg_size
  buildingVolumeM3: number | null; // bldg_vol_sb3dgdb
  flats: number | null;            // bldg_flats
  zone: string | null;             // cz_abbrev
  lat: number;
  lng: number;
}

/** Coerce to a positive finite number, else null. */
function num(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : null;
}

/** Coerce to a non-empty trimmed string (numbers stringified), else null. */
function txt(v: unknown): string | null {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

/**
 * Map a `parcel_data` feature's `properties` object into typed ParcelInfo.
 * Pure — no network — so it can be unit-tested directly.
 */
export function normalizeParcelProps(
  props: Record<string, unknown>,
  lat: number,
  lng: number,
): ParcelInfo {
  const locality = [props.zip, props.cityname, props.canton]
    .map(txt)
    .filter((s): s is string => s !== null)
    .join(' ');
  return {
    address: txt(props.address),
    locality: locality.length > 0 ? locality : null,
    egrid: txt(props.parcel_id),
    buildingSizeM2: num(props.bldg_size),
    buildingVolumeM3: num(props.bldg_vol_sb3dgdb),
    flats: num(props.bldg_flats),
    zone: txt(props.cz_abbrev),
    lat,
    lng,
  };
}

/**
 * Fetch parcel context for a coordinate. Returns null on any failure or when
 * no parcel feature is found — callers treat null as "no parcel data".
 */
export async function fetchParcelInfo(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<ParcelInfo | null> {
  const key = cacheKey(lat, lng);

  // Layer 1 — synchronous in-memory hit (populated this session or hydrated
  // from IndexedDB below).
  const memHit = memoryCache.get(key);
  if (memHit) return memHit;

  // Layer 2 — persistent IndexedDB hit. A few-ms read vs. a multi-second RES
  // round-trip on a cold reload.
  const idbHit = await persistentCache.get(key);
  if (idbHit) {
    memoryCache.set(key, idbHit);
    return idbHit;
  }

  try {
    const res = await fetch(PARCEL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
      signal,
    });
    if (!res.ok) return null;
    const json = await res.json();
    const props = json?.features?.[0]?.properties;
    if (!props || typeof props !== 'object') return null;
    const info = normalizeParcelProps(props as Record<string, unknown>, lat, lng);
    // Write through to both layers. set() never throws, so this stays out of
    // the caller's error path.
    memoryCache.set(key, info);
    void persistentCache.set(key, info);
    return info;
  } catch {
    return null;
  }
}
