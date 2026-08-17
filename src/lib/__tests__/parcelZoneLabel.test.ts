import { describe, it, expect } from 'vitest';
// Vite's `?raw` import: the module source as a string, no node:fs needed (the
// app tsconfig carries no node types).
import SRC from '../parcelInfo.ts?raw';

// Source contract for the suite-wide zone rule (aireon-shared
// docs/PARCEL_ZONE_STANDARD.md): the one place showroom derives a parcel's
// zone must go through @aireon/shared/parcel-zone and must not carry its own
// cz_local / cz_abbrev / cz_canton fallback chain or a raw cz_harmonized
// display read. Every zone surface (reporter strip, PDF fact, Claire context,
// publish prefill summary, listing facts) reads ParcelInfo.zone, so guarding
// this file guards all of them.
describe('parcelInfo zone source contract', () => {
  it('derives the zone through @aireon/shared/parcel-zone', () => {
    expect(SRC).toMatch(/from '@aireon\/shared\/parcel-zone'/);
    expect(SRC).toMatch(/zone:\s*resolveZoneLabel\(props\)/);
  });

  it('carries no hand-rolled zone fallback chain and no raw cz_harmonized read', () => {
    // Strip comments so the guard reads code, not prose about the old rule.
    const code = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(code).not.toMatch(/props\.cz_local/);
    expect(code).not.toMatch(/props\.cz_abbrev/);
    expect(code).not.toMatch(/props\.cz_canton\b/);
    expect(code).not.toMatch(/cz_harmonized/);
    expect(code).not.toMatch(/\[\s*'cz_local'/);
  });
});
