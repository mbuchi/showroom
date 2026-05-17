// swisstopo / BAFU (FOEN) environmental-noise sampling for the reporter.
//
// The federal sonBASE noise model is published as WMTS raster layers on
// geo.admin.ch. Raster layers have no feature table, so a point query is done
// by fetching the WMTS tile under the point and reading its pixel colour, then
// snapping that colour to the nearest legend band.
// Ported from boom/src/lib/noise.ts. wmts.geo.admin.ch sends
// Access-Control-Allow-Origin: *, so tiles can be drawn to a canvas safely.

/** Road-traffic day noise — the layer the reporter card samples + overlays. */
export const REPORTER_NOISE_WMTS = 'ch.bafu.laerm-strassenlaerm_tag';

/** WMTS tile template for a noise layer. */
export function wmtsTemplate(wmtsId: string): string {
  return `https://wmts.geo.admin.ch/1.0.0/${wmtsId}/default/current/3857/{z}/{x}/{y}.png`;
}

// ── Colour ramp ────────────────────────────────────────────────────────────
// dB(A) bands sampled directly from the official sonBASE legend swatches.
export interface NoiseBand {
  index: number;        // 0 = quietest mapped band … 7 = loudest
  min: number;          // lower dB(A) bound
  max: number | null;   // upper bound; null = open-ended top band
  label: string;        // e.g. '60–64.9 dB'
  rgb: [number, number, number];
  hex: string;
}

export const NOISE_BANDS: NoiseBand[] = [
  { index: 0, min: 40, max: 45, label: '40–44.9 dB', rgb: [41, 70, 39], hex: '#294627' },
  { index: 1, min: 45, max: 50, label: '45–49.9 dB', rgb: [239, 233, 49], hex: '#efe931' },
  { index: 2, min: 50, max: 55, label: '50–54.9 dB', rgb: [255, 190, 86], hex: '#ffbe56' },
  { index: 3, min: 55, max: 60, label: '55–59.9 dB', rgb: [240, 109, 51], hex: '#f06d33' },
  { index: 4, min: 60, max: 65, label: '60–64.9 dB', rgb: [233, 68, 64], hex: '#e94440' },
  { index: 5, min: 65, max: 70, label: '65–69.9 dB', rgb: [140, 43, 60], hex: '#8c2b3c' },
  { index: 6, min: 70, max: 75, label: '70–74.9 dB', rgb: [170, 143, 186], hex: '#aa8fba' },
  { index: 7, min: 75, max: null, label: '≥ 75 dB', rgb: [64, 74, 140], hex: '#404a8c' },
];

// ── Web-Mercator tile maths ────────────────────────────────────────────────
const TILE_SIZE = 256;
const SAMPLE_ZOOM = 17; // ~1.2 m/px at Swiss latitudes — fine for a point query

interface TilePixel {
  z: number;
  tx: number;
  ty: number;
  px: number;
  py: number;
}

function lngLatToTilePixel(lng: number, lat: number, z: number): TilePixel {
  const n = 2 ** z;
  const latRad = (lat * Math.PI) / 180;
  const xWorld = ((lng + 180) / 360) * n;
  const yWorld =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  const tx = Math.floor(xWorld);
  const ty = Math.floor(yWorld);
  return {
    z,
    tx,
    ty,
    px: Math.min(TILE_SIZE - 1, Math.max(0, Math.floor((xWorld - tx) * TILE_SIZE))),
    py: Math.min(TILE_SIZE - 1, Math.max(0, Math.floor((yWorld - ty) * TILE_SIZE))),
  };
}

// Cache decoded tile pixel buffers — nearby points re-hit the same tile.
const tileCache = new Map<string, ImageData>();

function loadTile(url: string): Promise<ImageData> {
  const cached = tileCache.get(url);
  if (cached) return Promise.resolve(cached);

  return new Promise<ImageData>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = TILE_SIZE;
      canvas.height = TILE_SIZE;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, TILE_SIZE, TILE_SIZE);
      const data = ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
      if (tileCache.size > 80) tileCache.clear();
      tileCache.set(url, data);
      resolve(data);
    };
    img.onerror = () => reject(new Error('Noise tile failed to load'));
    img.src = url;
  });
}

/** Snap an RGB colour to the nearest noise band, or null if off-ramp. */
export function nearestBand(r: number, g: number, b: number): NoiseBand | null {
  let best: NoiseBand | null = null;
  let bestDist = Infinity;
  for (const band of NOISE_BANDS) {
    const [br, bg, bb] = band.rgb;
    const dist = (r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = band;
    }
  }
  // Reject obviously off-ramp colours (e.g. a stray basemap pixel bled in).
  return bestDist <= 9000 ? best : null;
}

export interface NoiseSample {
  band: NoiseBand | null; // null = no mapped exposure ( < 40 dB / outside model )
}

/** Point query: read the noise band at a lng/lat for a given WMTS layer. */
export async function sampleNoiseAt(
  lat: number,
  lng: number,
  wmtsId: string,
): Promise<NoiseSample> {
  const tp = lngLatToTilePixel(lng, lat, SAMPLE_ZOOM);
  const url = `https://wmts.geo.admin.ch/1.0.0/${wmtsId}/default/current/3857/${tp.z}/${tp.tx}/${tp.ty}.png`;
  const tile = await loadTile(url);

  // Vote across a 5×5 neighbourhood to shrug off anti-aliasing on band edges.
  const votes = new Map<number, number>();
  let opaque = 0;
  let total = 0;
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const x = tp.px + dx;
      const y = tp.py + dy;
      if (x < 0 || y < 0 || x >= TILE_SIZE || y >= TILE_SIZE) continue;
      total++;
      const i = (y * TILE_SIZE + x) * 4;
      const a = tile.data[i + 3];
      if (a < 80) continue; // transparent → unmapped / quiet
      opaque++;
      const band = nearestBand(tile.data[i], tile.data[i + 1], tile.data[i + 2]);
      if (band) votes.set(band.index, (votes.get(band.index) ?? 0) + 1);
    }
  }

  // Mostly transparent → treat as no mapped exposure.
  if (total === 0 || opaque / total < 0.25 || votes.size === 0) {
    return { band: null };
  }

  let winner = -1;
  let winnerVotes = -1;
  for (const [idx, count] of votes) {
    if (count > winnerVotes) {
      winnerVotes = count;
      winner = idx;
    }
  }
  return { band: NOISE_BANDS.find((b) => b.index === winner) ?? null };
}

/** Sample the road-traffic-day noise band at a point. */
export async function noiseBandAt(lat: number, lng: number): Promise<NoiseBand | null> {
  const { band } = await sampleNoiseAt(lat, lng, REPORTER_NOISE_WMTS);
  return band;
}
