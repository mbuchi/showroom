import { describe, it, expect } from 'vitest';
import {
  displayAddress,
  healedSearch,
  parseReportParams,
  readDeepLinkAddress,
  settledAtPoint,
  valueAtPoint,
} from '../reportParams';

// The URL from the original report. These coordinates are on Embrach parcel
// CH813872487780, whose address is "Alte Rheinstrasse 91" — the label in the
// link says 87, and it is simply wrong.
const REPORTED =
  '?lat=47.521503&lng=8.583285&zoom=17.00&theme=dark&address=Alte+Rheinstrasse+87%2C+8424+Embrach';

describe('parseReportParams', () => {
  it('reads the legacy ?address= alias, not just ?q=', () => {
    // The old hand-rolled parser read `q` only, so a link minted with the
    // alias was invisible to the reporter entirely.
    const params = parseReportParams(REPORTED);
    expect(params).not.toBeNull();
    expect(params!.lat).toBeCloseTo(47.521503, 6);
    expect(params!.lng).toBeCloseTo(8.583285, 6);
    expect(params!.addressHint).toBe('Alte Rheinstrasse 87, 8424 Embrach');
  });

  it('prefers the canonical ?q= when both spellings are present', () => {
    const params = parseReportParams('?lat=47.5&lng=8.5&q=Canonical+1&address=Legacy+2');
    expect(params!.addressHint).toBe('Canonical 1');
  });

  it('is null without usable coordinates', () => {
    expect(parseReportParams('?q=Alte+Rheinstrasse+87')).toBeNull();
    expect(parseReportParams('?lat=47.5')).toBeNull();
    expect(parseReportParams('?lat=999&lng=8.5')).toBeNull();
  });
});

describe('readDeepLinkAddress', () => {
  it('never treats the text as authoritative when the URL carries coordinates', () => {
    // This is the whole defect: the label was taken as the answer AND it
    // short-circuited the lookup that would have corrected it.
    const { hint, authoritative } = readDeepLinkAddress(REPORTED);
    expect(hint).toBe('Alte Rheinstrasse 87, 8424 Embrach');
    expect(authoritative).toBe(false);
  });

  it('defers to a parcel id too', () => {
    expect(readDeepLinkAddress('?q=Some+Street+1&egrid=CH813872487780').authoritative).toBe(false);
    expect(readDeepLinkAddress('?q=Some+Street+1&parcel_id=CH813872487780').authoritative).toBe(
      false,
    );
  });

  it('is authoritative for a bare ?q= with nothing to defer to', () => {
    expect(readDeepLinkAddress('?q=Bahnhofstrasse+1%2C+8001+Z%C3%BCrich')).toEqual({
      hint: 'Bahnhofstrasse 1, 8001 Zürich',
      authoritative: true,
    });
  });

  it('reports no hint for whitespace or an absent param', () => {
    expect(readDeepLinkAddress('?lat=47.5&lng=8.5&q=%20%20')).toEqual({
      hint: null,
      authoritative: false,
    });
    expect(readDeepLinkAddress('')).toEqual({ hint: null, authoritative: false });
  });
});

describe('displayAddress', () => {
  it('lets the resolved parcel address overwrite the link text', () => {
    // The reported bug: the banner showed number 87 from the link while the
    // parcel identity right beneath it read number 91.
    const hint = parseReportParams(REPORTED)!.addressHint;
    expect(hint).toBe('Alte Rheinstrasse 87, 8424 Embrach');
    expect(displayAddress('Alte Rheinstrasse 91 8424 Embrach', hint)).toBe(
      'Alte Rheinstrasse 91 8424 Embrach',
    );
  });

  it('shows the link text while the lookup is still running', () => {
    expect(displayAddress(null, 'Alte Rheinstrasse 87, 8424 Embrach')).toBe(
      'Alte Rheinstrasse 87, 8424 Embrach',
    );
  });

  it('is null when there is nothing to show', () => {
    expect(displayAddress(null, null)).toBeNull();
    expect(displayAddress('  ', '  ')).toBeNull();
  });
});

describe('healedSearch', () => {
  it('stamps the resolved address over the stale one under the canonical key', () => {
    const healed = new URLSearchParams(healedSearch(REPORTED, 'Alte Rheinstrasse 91 8424 Embrach'));
    expect(healed.get('q')).toBe('Alte Rheinstrasse 91 8424 Embrach');
    // Leaving the alias behind would publish a link that reads back the value
    // it just replaced, since `q` wins over `address` on read.
    expect(healed.get('address')).toBeNull();
    // Everything unrelated survives.
    expect(healed.get('lat')).toBe('47.521503');
    expect(healed.get('lng')).toBe('8.583285');
    expect(healed.get('zoom')).toBe('17.00');
    expect(healed.get('theme')).toBe('dark');
  });

  it('round-trips: the healed link reads back the resolved address', () => {
    const healed = healedSearch(REPORTED, 'Alte Rheinstrasse 91 8424 Embrach');
    expect(parseReportParams(`?${healed}`)!.addressHint).toBe(
      'Alte Rheinstrasse 91 8424 Embrach',
    );
  });
});

describe('point scoping', () => {
  // The reporter's parcel and its resolved address outlive the coordinates they
  // describe by one render. Reproduced before this guard existed: an in-page
  // re-search from A to B ran the resolve effect with point B and parcel A, so
  // A's address was shown for B and stamped into B's URL under `q=` — the
  // reported defect, self-inflicted, on the one path that writes links.
  const A = { lat: 47.521503, lng: 8.583285 };
  const B = { lat: 47.376888, lng: 8.541694 };
  const parcelA = { lat: A.lat, lng: A.lng, value: { egrid: 'CH813872487780' } };

  it("refuses to hand one point another point's value", () => {
    expect(valueAtPoint(parcelA, A.lat, A.lng)).toEqual({ egrid: 'CH813872487780' });
    expect(valueAtPoint(parcelA, B.lat, B.lng)).toBeNull();
  });

  it('counts a lookup as settled only at its own point', () => {
    expect(settledAtPoint(parcelA, A.lat, A.lng)).toBe(true);
    // The gate that starts the address resolve. False here is what stops the
    // resolver being handed the previous location's EGRID.
    expect(settledAtPoint(parcelA, B.lat, B.lng)).toBe(false);
  });

  it('distinguishes "settled with no parcel" from "not looked yet"', () => {
    const nothingFound = { lat: A.lat, lng: A.lng, value: null };
    expect(valueAtPoint(nothingFound, A.lat, A.lng)).toBeNull();
    expect(settledAtPoint(nothingFound, A.lat, A.lng)).toBe(true);
    expect(settledAtPoint(null, A.lat, A.lng)).toBe(false);
  });

  it('reads as unset while the route carries no coordinates', () => {
    expect(valueAtPoint(parcelA, undefined, undefined)).toBeNull();
    expect(settledAtPoint(parcelA, undefined, undefined)).toBe(false);
    // A half-parsed route must not match on latitude alone.
    expect(settledAtPoint(parcelA, A.lat, undefined)).toBe(false);
  });
});
