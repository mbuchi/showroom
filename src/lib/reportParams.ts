// Reporter deep-link parameters, and how much to trust each one.
//
// COORDINATES AND PARCEL IDS ARE IDENTITY. TEXT IS A HINT.
//
// A link can describe one place twice, and the two spellings can disagree:
//
//   /reporter?lat=47.521503&lng=8.583285&q=Alte+Rheinstrasse+87,+8424+Embrach
//
// Those coordinates are on Embrach parcel CH813872487780, whose address is
// "Alte Rheinstrasse 91". The text is a snapshot taken by whatever minted the
// link: it goes stale the moment address resolution improves, it survives every
// hand-edit of the coordinates, and it outlives the parcel data it came from.
// Rendering it verbatim showed a location banner contradicting the parcel
// address printed directly beneath it.
//
// So the text is a PLACEHOLDER — shown immediately so no field flashes blank —
// and the coordinates decide. See aireon-shared/docs/URL_PARAMS_STANDARD.md,
// "Address precedence", and docs/PARCEL_ADDRESS_STANDARD.md.
//
// Why this mirrors `getDeepLinkAddress()` instead of calling it: the shared
// accessor reads a snapshot of `location.search` parsed ONCE at boot (the
// documented parse-once contract). Showroom is a pushState SPA whose reporter
// route changes on every search, so the shared snapshot would keep answering
// with the address the visitor first arrived on. The rules below are the same
// rules, applied to the live route's query string.

/** Every spelling of the search text, canonical first (`q` beats `address`). */
const ADDRESS_KEYS = ['q', 'address'] as const;

/** Parameters that IDENTIFY a place, as opposed to describing one. */
const IDENTITY_KEYS = ['egrid', 'EGRID', 'parcel_id'] as const;

export interface ReportParams {
  lat: number;
  lng: number;
  /**
   * The `?q=` / `?address=` text, trimmed. Safe to render IMMEDIATELY so the
   * location banner and the search field are never blank while the real lookup
   * runs — but it is only a hint, and the resolved parcel address must
   * overwrite it.
   */
  addressHint: string | null;
}

export interface DeepLinkAddress {
  hint: string | null;
  /**
   * True only when the text is the ONLY thing in the URL describing the
   * location — a bare `?q=`, with no coordinates or parcel id to defer to.
   * Then the text IS the answer and the app should geocode it.
   */
  authoritative: boolean;
}

function firstOf(p: URLSearchParams, keys: readonly string[]): string | null {
  for (const key of keys) {
    const raw = p.get(key)?.trim();
    if (raw) return raw;
  }
  return null;
}

function coords(p: URLSearchParams): { lat: number; lng: number } | null {
  const lat = Number.parseFloat(p.get('lat') ?? '');
  const lng = Number.parseFloat(p.get('lng') ?? '');
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

/**
 * The reporter's location, or null when the URL carries no usable coordinates.
 * The address text rides along as a hint only.
 */
export function parseReportParams(search: string): ReportParams | null {
  const p = new URLSearchParams(search);
  const point = coords(p);
  if (!point) return null;
  return { ...point, addressHint: firstOf(p, ADDRESS_KEYS) };
}

/**
 * How much to trust the `?q=` / `?address=` text on this route. Same contract
 * as the shared `getDeepLinkAddress()`, evaluated against a live query string.
 */
export function readDeepLinkAddress(search: string): DeepLinkAddress {
  const p = new URLSearchParams(search);
  const hint = firstOf(p, ADDRESS_KEYS);
  const hasIdentity = coords(p) !== null || firstOf(p, IDENTITY_KEYS) !== null;
  return { hint, authoritative: hint !== null && !hasIdentity };
}

/**
 * What the reporter actually shows for a location.
 *
 * The precedence is the whole point of this module and is one-directional: an
 * address resolved from the coordinates ALWAYS wins over the text in the link,
 * and the text is only ever a placeholder that keeps the banner from flashing
 * blank while the lookup runs.
 */
export function displayAddress(
  resolvedLabel: string | null | undefined,
  hint: string | null | undefined,
): string | null {
  return resolvedLabel?.trim() || hint?.trim() || null;
}

/**
 * The query string for a healed link: the resolved address stamped over the
 * stale text, written under the canonical `q` key with the legacy `address`
 * alias removed. Reading resolves `q` before `address`, so leaving a stale
 * alias behind would publish links that read back the value just replaced.
 * Every unrelated param (theme, lang, mode, quiet-boot flags) is preserved.
 */
export function healedSearch(search: string, label: string): string {
  const p = new URLSearchParams(search);
  p.set('q', label);
  p.delete('address');
  return p.toString();
}
