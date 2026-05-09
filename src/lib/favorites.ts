// User-scoped favorites storage. The image API has no favorites primitive
// today, so we persist locally per-user. When a backend field appears we can
// switch the storage layer without changing call sites.

const KEY_PREFIX = 'showroom:favorites:';

function storageKey(userId: string): string {
  return `${KEY_PREFIX}${userId || 'anon'}`;
}

export function loadFavorites(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((v): v is string => typeof v === 'string'));
  } catch {
    return new Set();
  }
}

export function saveFavorites(userId: string, favorites: Set<string>): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify([...favorites]));
  } catch {
    // localStorage might be full or disabled — favorites are non-critical.
  }
}
