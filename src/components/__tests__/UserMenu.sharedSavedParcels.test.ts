import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Source contracts for the account menu.
//
// showroom used to pass a custom summary node carrying the gallery image count.
// That prop sets `hasCustomDropdownSummary` in the shared shell, which
// suppresses the built-in saved-parcels block entirely. Because only
// GalleryView passes `exportCount`, the block rendered on /reporter and
// /publish and vanished on the gallery - which is also `/` and every unknown
// path. The menu had two shapes depending on the route.
//
// The count now lives in `extraItems`, so the standard block renders on every
// route. This guard exists because the failure mode is silent: the menu still
// "works" with the block missing.
// cwd-based, not import.meta.url: showroom's vitest environment is jsdom,
// where import.meta.url does not resolve.
const read = (path: string) => readFileSync(resolve(process.cwd(), 'src', path), 'utf8');

// These guards are about CODE, not prose: the comments above and in the source
// name the very prop they forbid. Strip comments first so documenting a trap
// can never fail the guard against it.
const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('account menu renders the shared saved-parcels block on every route', () => {
  const userMenu = read('components/UserMenu.tsx');

  it('passes nothing that would suppress the built-in block', () => {
    const code = stripComments(userMenu);
    expect(code).not.toContain('dropdownSummary');
    expect(code).not.toContain('summaryHandlers');
    expect(code).not.toContain('summary=');
    // showSavedParcels must stay TRUE (it is passed as a bare attribute).
    expect(code).not.toContain('showSavedParcels={false}');
    expect(code).toContain('showSavedParcels');
  });

  it('keeps the gallery count reachable as an account-section row', () => {
    expect(userMenu).toContain("key: 'gallery-count'");
    expect(userMenu).toContain("t('menu.in_your_gallery')");
    expect(userMenu).toContain('extraItems={extraItems}');
    // A raw number badge is falsy at 0 and would render no badge at all.
    expect(userMenu).toContain('badge: String(exportCount)');
    // The row is personal data, so it must NOT be surfaced to signed-out
    // visitors the way the public tool rows are.
    const rowStart = userMenu.indexOf("key: 'gallery-count'");
    const rowEnd = userMenu.indexOf('];', rowStart);
    expect(userMenu.slice(rowStart, rowEnd)).not.toContain('signedOut');
  });

  it('preserves the live view state when opening a saved parcel', () => {
    expect(userMenu).toContain('new URL(window.location.href)');
    expect(userMenu).toContain("url.pathname = '/reporter'");
    // `q` must be swept, never re-seeded from the record label: it can name a
    // different parcel than the coordinates it travels with.
    for (const stale of ['q', 'address', 'egrid', 'EGRID', 'parcel_id', 'select']) {
      expect(userMenu).toContain(`'${stale}'`);
    }
    expect(stripComments(userMenu)).not.toContain('params.set(');
  });

  it('keeps search history suppressed, since the navbar owns it', () => {
    expect(userMenu).toContain('showSearchHistory={false}');
  });
});
