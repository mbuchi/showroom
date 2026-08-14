import { describe, it, expect } from 'vitest';
import { prmLabel } from '../reportAddress';
import type { ParcelInfo } from '../parcelInfo';

const LAT = 47.521503;
const LNG = 8.583285;

const EMBRACH = {
  address: 'Alte Rheinstrasse 91',
  locality: '8424 Embrach ZH',
  egrid: 'CH813872487780',
  lat: LAT,
  lng: LNG,
} as unknown as ParcelInfo;

const RESOLVED = {
  label: 'Alte Rheinstrasse 91 8424 Embrach',
  street: 'Alte Rheinstrasse 91',
  zip: '8424',
  city: 'Embrach',
  source: 'gwr' as const,
};

describe('prmLabel', () => {
  it('labels the saved parcel from the resolved address', () => {
    expect(prmLabel(EMBRACH, RESOLVED, LAT, LNG)).toBe('Alte Rheinstrasse 91 8424 Embrach');
  });

  it("falls back to the parcel's own address, never the URL text", () => {
    // Before this fix the label came straight from ?q=, so a link carrying
    // "Alte Rheinstrasse 87" wrote number 87 onto a record keyed by the EGRID
    // of the parcel at number 91 — permanently, in the user's saved parcels.
    expect(prmLabel(EMBRACH, null, LAT, LNG)).toBe('Alte Rheinstrasse 91 8424 Embrach ZH');
  });

  it('falls back to coordinates when the register knows no address', () => {
    const unaddressed = { address: null, locality: null } as unknown as ParcelInfo;
    expect(prmLabel(unaddressed, null, LAT, LNG)).toBe('47.521503, 8.583285');
  });
});
