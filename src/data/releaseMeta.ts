// Tiny, eager release metadata — the CURRENT_VERSION string (drives the "unread"
// dot on the What's-new row) and the repo URL. Kept in its own module so the
// account menu can read them WITHOUT importing ./releaseNotes, whose ~2k lines
// of changelog data + ~40 lucide-react icons would otherwise land in the eager
// initial bundle. The full RELEASES array is lazy-loaded only when the
// What's-new panel opens. A vitest asserts CURRENT_VERSION === RELEASES[0].version
// so this literal can never drift from the changelog.
export const CURRENT_VERSION = '0.19.0';
export const REPO_URL = 'https://github.com/mbuchi/showroom';
