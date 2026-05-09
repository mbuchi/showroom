export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function formatRelativeTime(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffSec = Math.round((now - then) / 1000);
    const abs = Math.abs(diffSec);
    if (abs < 60) return 'just now';
    if (abs < 3600) return `${Math.round(abs / 60)}m ago`;
    if (abs < 86400) return `${Math.round(abs / 3600)}h ago`;
    if (abs < 604800) return `${Math.round(abs / 86400)}d ago`;
    return formatShortDate(iso);
  } catch {
    return iso;
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatCoord(n: unknown): string | null {
  return typeof n === 'number' ? n.toFixed(5) : null;
}

export function formatDeg(n: unknown): string | null {
  return typeof n === 'number' ? `${Math.round(n)}°` : null;
}

export function pluralize(n: number, singular: string, plural?: string): string {
  return n === 1 ? singular : plural || `${singular}s`;
}
