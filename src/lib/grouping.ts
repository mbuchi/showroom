import type { SavedImage } from '../services/imageService';

export interface ParcelGroupData {
  parcelId: string | null;
  exports: SavedImage[];
  address: string | null;
  apps: string[];
  lastActivity: string;
  totalBytes: number;
}

export const UNGROUPED_KEY = '__ungrouped__';

// Pull a parcel reference from either the canonical column or the metadata
// fallback, so older uploads (and uploads from apps that didn't set prm_id)
// still group meaningfully.
export function getParcelRef(img: SavedImage): string | null {
  if (img.prm_id) return img.prm_id;
  const meta = img.custom_metadata?.central_parcel_id;
  return typeof meta === 'string' && meta ? meta : null;
}

function pickAddress(items: SavedImage[]): string | null {
  for (const item of items) {
    const addr = item.custom_metadata?.address;
    if (typeof addr === 'string' && addr.trim()) return addr;
  }
  return null;
}

export function groupExportsByParcel(images: SavedImage[]): ParcelGroupData[] {
  const buckets = new Map<string, SavedImage[]>();

  for (const img of images) {
    const key = getParcelRef(img) || UNGROUPED_KEY;
    const list = buckets.get(key);
    if (list) list.push(img);
    else buckets.set(key, [img]);
  }

  const groups: ParcelGroupData[] = [];
  for (const [key, items] of buckets) {
    const apps = Array.from(new Set(items.map((i) => i.app_source))).sort();
    const lastActivity = items.reduce(
      (max, i) => (i.created_at > max ? i.created_at : max),
      items[0].created_at
    );
    const totalBytes = items.reduce((sum, i) => sum + (i.file_size || 0), 0);
    groups.push({
      parcelId: key === UNGROUPED_KEY ? null : key,
      exports: items.sort((a, b) => b.created_at.localeCompare(a.created_at)),
      address: pickAddress(items),
      apps,
      lastActivity,
      totalBytes,
    });
  }
  return groups;
}

export type SortMode = 'recent' | 'oldest' | 'count' | 'address';

export function sortGroups(groups: ParcelGroupData[], mode: SortMode): ParcelGroupData[] {
  const copy = [...groups];
  switch (mode) {
    case 'recent':
      return copy.sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
    case 'oldest':
      return copy.sort((a, b) => a.lastActivity.localeCompare(b.lastActivity));
    case 'count':
      return copy.sort((a, b) => b.exports.length - a.exports.length);
    case 'address':
      return copy.sort((a, b) => {
        const av = a.address || a.parcelId || '';
        const bv = b.address || b.parcelId || '';
        return av.localeCompare(bv);
      });
  }
}

export function sortFlat(images: SavedImage[], mode: SortMode): SavedImage[] {
  const copy = [...images];
  switch (mode) {
    case 'recent':
      return copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
    case 'oldest':
      return copy.sort((a, b) => a.created_at.localeCompare(b.created_at));
    case 'count':
    case 'address':
      return copy.sort((a, b) => {
        const av = a.custom_metadata?.address || a.prm_id || a.original_filename;
        const bv = b.custom_metadata?.address || b.prm_id || b.original_filename;
        return String(av).localeCompare(String(bv));
      });
  }
}

// Lightweight filter that searches across the fields a user is most likely to
// remember about a screenshot — address, parcel id, and the original filename.
export function matchesQuery(img: SavedImage, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const fields = [
    img.original_filename,
    img.app_source,
    img.prm_id,
    img.custom_metadata?.address,
    img.custom_metadata?.central_parcel_id,
  ];
  return fields.some((v) => v && String(v).toLowerCase().includes(q));
}
