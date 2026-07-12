import { describe, it, expect } from 'vitest';
import { RELEASES } from '../releaseNotes';
import { CURRENT_VERSION } from '../releaseMeta';

describe('release metadata', () => {
  it('eager CURRENT_VERSION matches the newest RELEASES entry', () => {
    // CURRENT_VERSION is a tiny literal in releaseMeta.ts so the account menu can
    // read it without pulling the full (lazy-loaded) changelog. This guards the
    // literal against drifting from the actual top-of-changelog version, which
    // would silently break the "unread release" dot.
    expect(CURRENT_VERSION).toBe(RELEASES[0].version);
  });
});
