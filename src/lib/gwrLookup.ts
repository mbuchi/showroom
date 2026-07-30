// Federal Building and Dwelling Register (GWR / RegBL) lookup for the publish
// page — the dwelling-level facts a listing needs (living space, rooms, floor)
// that the parcel record cannot carry, because a parcel has one row and a
// building has many apartments.
//
// Layer: ch.bfs.gebaeude_wohnungs_register, queried by EGRID through the
// swisstopo `find` endpoint. api3.geo.admin.ch is keyless and sends
// Access-Control-Allow-Origin: *, so this is a direct browser call with no
// proxy — same as solarLookup.ts in this app and groove's swissTopoApi.ts.

import { IndexedDBCache } from '@aireon/shared';

export const GWR_LAYER = 'ch.bfs.gebaeude_wohnungs_register';
export const GWR_FIND_ENDPOINT = 'https://api3.geo.admin.ch/rest/services/api/MapServer/find';

/** One dwelling (apartment) inside a building, flattened out of the register's
 *  index-aligned per-building arrays. */
export interface GwrDwelling {
  /** EWID — the dwelling's id within its building. Unique per building, so it
   *  doubles as the picker's row key. */
  ewid: string;
  /** Raw `wstwk` floor code, kept so the UI can render a locale-aware label. */
  floorCode: number | null;
  /** LOCALE-FREE floor value written into the draft's `floor` field: '0' for
   *  the ground floor, '2' for the second upper floor, '-1' for the first
   *  basement. The human-readable label ("Ground floor", "Erdgeschoss") is
   *  derived in the UI from `floorCode` — never from this string. */
  floorLabel: string | null;
  /** `wazim` — rooms, in Swiss half-steps (3.5, 4.5). */
  rooms: number | null;
  /** `warea` — living space in m2. */
  areaM2: number | null;
}

/** One building on the parcel, merged across its entrance rows. */
export interface GwrBuilding {
  egid: string;
  /** `gbauj` — year of construction. */
  yearBuilt: number | null;
  /** `gastw` — number of floors in the building. */
  floors: number | null;
  /** `ganzwhg` — dwelling count the register states for the building. May
   *  disagree with `dwellings.length` when the register lists no unit rows. */
  dwellingCount: number | null;
  dwellings: GwrDwelling[];
}

/** `wstwk` code for the ground floor. 3100 = ground, 3101 = 1st upper floor,
 *  3102 = 2nd, and so on up through the 31xx band. */
const WSTWK_GROUND_BASE = 3100;
/** `wstwk` basement band. 3401 = 1st basement, 3402 = 2nd, and so on. Note
 *  3400 itself is not a floor — the band starts at 3401. */
const WSTWK_BASEMENT_BASE = 3400;

/**
 * Decode a `wstwk` register floor code into the numeric floor string the IDX
 * `floor` field expects. Returns null for an unknown, missing or out-of-band
 * code so the caller simply leaves the floor unset rather than guessing.
 */
export function wstwkToFloor(code: number | null | undefined): string | null {
  if (typeof code !== 'number' || !Number.isInteger(code)) return null;
  if (code >= WSTWK_GROUND_BASE && code < WSTWK_GROUND_BASE + 100) {
    return String(code - WSTWK_GROUND_BASE);
  }
  if (code > WSTWK_BASEMENT_BASE && code < WSTWK_BASEMENT_BASE + 100) {
    return String(-(code - WSTWK_BASEMENT_BASE));
  }
  return null;
}

/** Coerce to a positive finite number, else null. The register uses null for
 *  "not recorded" and never means a real 0 room / 0 m2 / 0 floor dwelling. */
function num(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : null;
}

/** Plausible calendar year, else null. */
function year(v: unknown): number | null {
  const n = num(v);
  if (n === null || !Number.isInteger(n)) return null;
  return n >= 1000 && n <= 2100 ? n : null;
}

/** Non-empty trimmed string (numbers stringified), else null. */
function txt(v: unknown): string | null {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

/** Normalize a dwelling-level attribute to an array. The register sends these
 *  as parallel arrays, but a single-dwelling building can come back as a bare
 *  scalar, and an absent attribute as null. */
function asArray(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (v === null || v === undefined) return [];
  return [v];
}

interface GwrFindRow {
  featureId?: string | number;
  attributes?: Record<string, unknown>;
}

/**
 * Flatten a building row's index-aligned dwelling arrays into objects.
 *
 * `rowKey` disambiguates the synthetic id used when the register omits an EWID:
 * two entrance rows of the same building would otherwise both produce "#0" and
 * collide during the dedupe below.
 */
function flattenDwellings(attrs: Record<string, unknown>, rowKey: string): GwrDwelling[] {
  const ewids = asArray(attrs.ewid);
  const floorCodes = asArray(attrs.wstwk);
  const areas = asArray(attrs.warea);
  const roomCounts = asArray(attrs.wazim);

  // The arrays are index-aligned but not guaranteed equal in length, so walk
  // the longest one and let the shorter ones read as null.
  const length = Math.max(ewids.length, floorCodes.length, areas.length, roomCounts.length);

  const dwellings: GwrDwelling[] = [];
  for (let i = 0; i < length; i += 1) {
    const ewid = txt(ewids[i]);
    const floorCode = num(floorCodes[i]);
    const rooms = num(roomCounts[i]);
    const areaM2 = num(areas[i]);

    // A slot where every attribute is null is register padding, not a dwelling.
    if (ewid === null && floorCode === null && rooms === null && areaM2 === null) continue;

    dwellings.push({
      ewid: ewid ?? `${rowKey}#${i}`,
      floorCode,
      floorLabel: wstwkToFloor(floorCode),
      rooms,
      areaM2,
    });
  }
  return dwellings;
}

/**
 * Turn a `find` response's `results` into one entry per building.
 *
 * The register returns ONE ROW PER BUILDING x ENTRANCE (featureId
 * "{egid}_{edid}"), so a building with three entrances arrives three times.
 * Counting rows would triple the building count and duplicate every dwelling,
 * so rows are merged on `egid`: building-level facts coalesce (an entrance row
 * can carry a null where a sibling has the value) and dwellings are appended,
 * deduped by EWID.
 *
 * Pure — no network, no cache — so the shape handling is unit-testable.
 */
export function normalizeGwrResults(results: unknown): GwrBuilding[] {
  if (!Array.isArray(results)) return [];

  const byEgid = new Map<string, GwrBuilding>();

  for (const row of results as GwrFindRow[]) {
    const attrs = row?.attributes;
    if (!attrs || typeof attrs !== 'object') continue;

    const egid = txt(attrs.egid);
    if (egid === null) continue;

    const rowKey = txt(row.featureId) ?? egid;
    const dwellings = flattenDwellings(attrs, rowKey);

    const existing = byEgid.get(egid);
    if (!existing) {
      byEgid.set(egid, {
        egid,
        yearBuilt: year(attrs.gbauj),
        floors: num(attrs.gastw),
        dwellingCount: num(attrs.ganzwhg),
        dwellings,
      });
      continue;
    }

    existing.yearBuilt ??= year(attrs.gbauj);
    existing.floors ??= num(attrs.gastw);
    existing.dwellingCount ??= num(attrs.ganzwhg);
    for (const dwelling of dwellings) {
      if (existing.dwellings.some((d) => d.ewid === dwelling.ewid)) continue;
      existing.dwellings.push(dwelling);
    }
  }

  return [...byEgid.values()];
}

/**
 * Pick the building a listing most likely refers to: the one with dwellings,
 * else the one with floors, else the one with a construction year, else the
 * first. Same heuristic as proove's GWR default-building pick, so the two apps
 * agree on which building a parcel "is".
 */
export function pickPrimaryBuilding(buildings: GwrBuilding[]): GwrBuilding | null {
  return (
    buildings.find((b) => b.dwellingCount !== null && b.dwellingCount > 0) ??
    buildings.find((b) => b.floors !== null && b.floors > 0) ??
    buildings.find((b) => b.yearBuilt !== null) ??
    buildings[0] ??
    null
  );
}

// Two-layer client cache, mirroring solarLookup.ts: a synchronous in-memory Map
// fronts an IndexedDBCache so re-picking a previously searched address resolves
// without touching the network, even after a reload. The register updates
// quarterly at most, so groove's 24 h TTL is safe here too, and a small byte
// budget keeps the store bounded via LRU eviction. Every IndexedDBCache failure
// path is silent, so a blocked or broken IndexedDB degrades to a plain fetch.
const GWR_CACHE_TTL_MINUTES = 24 * 60; // 24 hours
const GWR_CACHE_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

const gwrMemoryCache = new Map<string, GwrBuilding[]>();
const gwrPersistentCache = new IndexedDBCache<GwrBuilding[]>('showroom-gwr', 'dwellings', {
  ttlMinutes: GWR_CACHE_TTL_MINUTES,
  maxBytes: GWR_CACHE_MAX_BYTES,
});

/**
 * Fetch the register's buildings for a parcel EGRID.
 *
 * Returns null on any failure (network, non-2xx, malformed body, abort) and an
 * empty array when the register simply knows nothing about the parcel — both
 * are "no dwelling data", but only the empty array is worth caching.
 */
export async function fetchGwrBuildings(
  egrid: string,
  signal?: AbortSignal,
): Promise<GwrBuilding[] | null> {
  const key = egrid.trim();
  if (key === '') return null;

  // Layer 1 — synchronous in-memory hit.
  const memHit = gwrMemoryCache.get(key);
  if (memHit) return memHit;

  // Layer 2 — persistent IndexedDB hit.
  const idbHit = await gwrPersistentCache.get(key);
  if (idbHit) {
    gwrMemoryCache.set(key, idbHit);
    return idbHit;
  }
  // A cache lookup is async; the caller may have moved on while we waited.
  if (signal?.aborted) return null;

  try {
    const url = new URL(GWR_FIND_ENDPOINT);
    url.searchParams.set('layer', GWR_LAYER);
    url.searchParams.set('searchText', key);
    url.searchParams.set('searchField', 'egrid');
    url.searchParams.set('contains', 'false');
    url.searchParams.set('returnGeometry', 'false');
    url.searchParams.set('lang', 'en');

    const res = await fetch(url.toString(), { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: unknown } | null;
    const buildings = normalizeGwrResults(data?.results);

    // Write through to both layers. set() never throws, so this stays out of
    // the caller's error path.
    gwrMemoryCache.set(key, buildings);
    void gwrPersistentCache.set(key, buildings);
    return buildings;
  } catch {
    // Includes the AbortError of a superseded lookup — the caller's sequence
    // guard is what decides whether a result may still be written.
    return null;
  }
}
