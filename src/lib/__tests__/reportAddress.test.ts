import { describe, it, expect, vi, beforeEach } from 'vitest';

const resolveParcelAddress = vi.fn();
const resolveAddressAtPoint = vi.fn();

vi.mock('@aireon/shared/geoadmin', () => ({
  resolveParcelAddress: (...args: unknown[]) => resolveParcelAddress(...args),
  resolveAddressAtPoint: (...args: unknown[]) => resolveAddressAtPoint(...args),
}));

const { resolveReportAddress } = await import('../reportAddress');
type ParcelInfoLike = Parameters<typeof resolveReportAddress>[2];

// The coordinates from the original report — Embrach parcel CH813872487780.
const LAT = 47.521503;
const LNG = 8.583285;

const EMBRACH = {
  address: 'Alte Rheinstrasse 91',
  locality: '8424 Embrach ZH',
  egrid: 'CH813872487780',
  zip: '8424',
  city: 'Embrach',
  lat: LAT,
  lng: LNG,
} as unknown as NonNullable<ParcelInfoLike>;

const RESOLUTION = {
  label: 'Alte Rheinstrasse 91 8424 Embrach',
  street: 'Alte Rheinstrasse 91',
  zip: '8424',
  city: 'Embrach',
  source: 'tile' as const,
};

beforeEach(() => {
  resolveParcelAddress.mockReset();
  resolveAddressAtPoint.mockReset();
});

describe('resolveReportAddress', () => {
  it('asks the parcel, keyed by its EGRID, when showroom already holds one', () => {
    resolveParcelAddress.mockResolvedValue(RESOLUTION);
    return resolveReportAddress(LAT, LNG, EMBRACH).then((result) => {
      expect(result).toEqual(RESOLUTION);
      expect(resolveAddressAtPoint).not.toHaveBeenCalled();
      const [args] = resolveParcelAddress.mock.calls[0] as [Record<string, unknown>];
      expect(args.egrid).toBe('CH813872487780');
      // Passed under the tile-property names the resolver reads, so an already
      // good address answers without a request.
      expect(args.properties).toEqual({
        address: 'Alte Rheinstrasse 91',
        zip: '8424',
        cityname: 'Embrach',
      });
    });
  });

  it('identifies the parcel under the point when RES gave us nothing', async () => {
    resolveAddressAtPoint.mockResolvedValue(RESOLUTION);
    const result = await resolveReportAddress(LAT, LNG, null);
    expect(result).toEqual(RESOLUTION);
    expect(resolveParcelAddress).not.toHaveBeenCalled();
    expect(resolveAddressAtPoint).toHaveBeenCalledWith(LAT, LNG, { signal: undefined });
  });

  it('never reverse-geocodes the raw coordinate itself', async () => {
    // A point lookup at these coordinates returns "Alte Rheinstrasse 91.1" —
    // the garage sharing the plot — and at a 50 m tolerance a neighbour's
    // address on a different parcel is in range.
    resolveAddressAtPoint.mockResolvedValue(null);
    await resolveReportAddress(LAT, LNG, null);
    await resolveReportAddress(LAT, LNG, EMBRACH);
    expect(resolveAddressAtPoint.mock.calls).toHaveLength(1);
  });

  it('resolves null instead of throwing when the lookup fails', async () => {
    resolveParcelAddress.mockRejectedValue(new Error('geo.admin down'));
    await expect(resolveReportAddress(LAT, LNG, EMBRACH)).resolves.toBeNull();
  });

  it('resolves null for a non-finite point', async () => {
    await expect(resolveReportAddress(Number.NaN, LNG, null)).resolves.toBeNull();
    expect(resolveAddressAtPoint).not.toHaveBeenCalled();
  });
});
