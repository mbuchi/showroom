import { describe, it, expect } from 'vitest';
import { extractParcelStats } from '../parcelLookup';

describe('extractParcelStats', () => {
  it('reads price and height from parcel properties', () => {
    const s = extractParcelStats({
      estimated_price_m2: 8450.4,
      bldg_height_max: 23.42,
      bldg_height_min: 11.2,
    });
    expect(s.priceM2).toBe(8450);
    expect(s.heightMax).toBeCloseTo(23.4, 1);
    expect(s.heightMin).toBeCloseTo(11.2, 1);
  });

  it('returns nulls for missing or zero values', () => {
    const s = extractParcelStats({ estimated_price_m2: 0 });
    expect(s.priceM2).toBeNull();
    expect(s.heightMax).toBeNull();
    expect(s.heightMin).toBeNull();
  });

  it('tolerates string-encoded numbers', () => {
    const s = extractParcelStats({ estimated_price_m2: '7200' });
    expect(s.priceM2).toBe(7200);
  });
});
