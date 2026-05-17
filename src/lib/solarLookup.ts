// swisstopo / BFE Sonnendach (roof solar suitability) lookup for the reporter.
//
// Layer: ch.bfe.solarenergie-eignung-daecher
// Ported from soolar/src/lib/solar.ts — api3.geo.admin.ch sends
// Access-Control-Allow-Origin: *, so no proxy is needed.

export const SOLAR_LAYER = 'ch.bfe.solarenergie-eignung-daecher';

/** WMTS tile template for the Sonnendach overlay. */
export const SOLAR_WMTS =
  'https://wmts.geo.admin.ch/1.0.0/ch.bfe.solarenergie-eignung-daecher/default/current/3857/{z}/{x}/{y}.png';

export interface SolarRoofProperties {
  building_id?: number;
  gwr_egid?: number | string | null;
  flaeche?: number;       // suitable area, m²
  stromertrag?: number;   // PV yield, kWh/yr
  [key: string]: unknown;
}

export interface SolarRoofFeature {
  id?: number | string;
  featureId?: number | string;
  layerBodId?: string;
  attributes?: SolarRoofProperties;
  properties?: SolarRoofProperties;
}

interface IdentifyResponse {
  results?: SolarRoofFeature[];
}

// Translate WGS84 lng/lat → Swiss LV95 (EPSG:2056). Approximation good enough
// for the identify call's tolerance. swisstopo transformation formulas.
export function wgs84ToLv95(lng: number, lat: number): { east: number; north: number } {
  const phi = (lat * 3600 - 169028.66) / 10000;
  const lam = (lng * 3600 - 26782.5) / 10000;

  const east =
    2600072.37 +
    211455.93 * lam -
    10938.51 * lam * phi -
    0.36 * lam * phi * phi -
    44.54 * Math.pow(lam, 3);

  const north =
    1200147.07 +
    308807.95 * phi +
    3745.25 * Math.pow(lam, 2) +
    76.63 * Math.pow(phi, 2) -
    194.56 * Math.pow(lam, 2) * phi +
    119.79 * Math.pow(phi, 3);

  return { east, north };
}

/** Call the swisstopo identify endpoint for the solar roof layer at a point. */
export async function identifySolarAt(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<SolarRoofFeature[]> {
  const { east, north } = wgs84ToLv95(lng, lat);
  const pad = 25; // metres — tolerance circle around the point

  const url = new URL('https://api3.geo.admin.ch/rest/services/api/MapServer/identify');
  url.searchParams.set('geometry', `${east},${north}`);
  url.searchParams.set('geometryType', 'esriGeometryPoint');
  url.searchParams.set('geometryFormat', 'geojson');
  url.searchParams.set('imageDisplay', '1920,1080,96');
  url.searchParams.set('mapExtent', `${east - pad},${north - pad},${east + pad},${north + pad}`);
  url.searchParams.set('tolerance', '10');
  url.searchParams.set('layers', `all:${SOLAR_LAYER}`);
  url.searchParams.set('sr', '2056');
  url.searchParams.set('lang', 'en');
  url.searchParams.set('returnGeometry', 'false');
  url.searchParams.set('limit', '50');

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error(`identify failed (${res.status})`);
  const data: IdentifyResponse = await res.json();
  return data.results ?? [];
}

/** Sum PV yield (stromertrag, kWh/yr) across all roof features at a point. */
export function summarizeYield(features: SolarRoofFeature[]): number {
  let total = 0;
  for (const f of features) {
    const p = (f.attributes ?? f.properties ?? {}) as SolarRoofProperties;
    if (typeof p.stromertrag === 'number' && Number.isFinite(p.stromertrag)) {
      total += p.stromertrag;
    }
  }
  return total;
}

/** Convenience: identify + sum. Returns total kWh/yr, or null if no roofs. */
export async function totalYieldAt(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<number | null> {
  const features = await identifySolarAt(lat, lng, signal);
  if (features.length === 0) return null;
  return summarizeYield(features);
}

/** Format a kWh/yr value into a compact MWh / GWh string. */
export function formatKWh(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} GWh`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)} MWh`;
  return `${Math.round(value)} kWh`;
}
