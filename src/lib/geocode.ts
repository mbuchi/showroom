// Mapbox geocoding — resolves a free-text Swiss address to coordinates so the
// reporter can deep-link every map-first app at the same point.

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

export const isGeocodingConfigured = !!TOKEN;

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

  const url = new URL('https://api.mapbox.com/search/geocode/v6/forward');
  url.searchParams.set('q', trimmed);
  url.searchParams.set('country', 'ch');
  url.searchParams.set('limit', '5');
  url.searchParams.set('types', 'address,street,place');
  url.searchParams.set('access_token', TOKEN);

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const data = (await res.json()) as { features?: MapboxFeature[] };

  return (data.features ?? [])
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
}
