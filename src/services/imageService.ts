import { userManager } from '../auth/authConfig';

const API_BASE = 'https://res.zeroo.ch/image/swissnovo';
export const APP_SOURCE = 'showroom';

export interface SavedImage {
  id: string;
  user_id: string;
  prm_id: string | null;
  app_source: string;
  original_filename: string;
  file_path: string;
  public_url: string;
  mime_type: string;
  file_size: number;
  width: number;
  height: number;
  custom_metadata: ScreenshotMetadata | null;
  created_at: string;
  updated_at: string;
}

// The shape of metadata produced by the upstream capture flow (Roofs today).
// Extra fields are allowed so other apps can store flexible context without
// a schema change — display logic falls back to a generic key/value list.
export interface ScreenshotMetadata {
  url?: string;
  viewport?: { width: number; height: number };
  captured_at?: string;
  central_lat?: number;
  central_lng?: number;
  central_parcel_id?: string | null;
  tilt_degree?: number;
  bearing_degree?: number;
  zoom?: number;
  address?: string | null;
  basemap?: string;
  is_3d_mode?: boolean;
  [key: string]: unknown;
}

export const APP_LABELS: Record<string, string> = {
  roofs: 'Roofs',
  geopool: 'GeoPool',
  showroom: 'Showroom',
};

// Tailwind classes for each known app. Falls back to a neutral chip for
// unknown sources so new apps don't crash the UI.
export const APP_BADGE_CLASSES: Record<string, string> = {
  roofs: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/20',
  geopool: 'bg-violet-500/15 text-violet-300 border-violet-400/20',
  showroom: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/20',
};

export interface ListFilters {
  appSource?: string;
  prmId?: string;
}

async function getAuthToken(): Promise<string> {
  const user = await userManager.getUser();
  if (!user || user.expired) throw new Error('Not authenticated');
  const token = user.id_token || user.access_token;
  if (!token) throw new Error('Not authenticated');
  return token;
}

export async function listImages(filters: ListFilters = {}): Promise<SavedImage[]> {
  const token = await getAuthToken();
  const params = new URLSearchParams();
  if (filters.appSource) params.set('app_source', filters.appSource);
  if (filters.prmId) params.set('prm_id', filters.prmId);
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/list${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `List failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteImage(id: string): Promise<void> {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Delete failed: ${res.status}`);
  }
}
