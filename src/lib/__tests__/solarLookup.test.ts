import { describe, it, expect } from 'vitest';
import { summarizeYield, formatKWh, wgs84ToLv95 } from '../solarLookup';

describe('solarLookup', () => {
  it('sums stromertrag across roof features', () => {
    const total = summarizeYield([
      { attributes: { gwr_egid: 1, stromertrag: 6000, flaeche: 40 } },
      { attributes: { gwr_egid: 1, stromertrag: 8000, flaeche: 55 } },
    ]);
    expect(total).toBe(14000);
  });

  it('returns 0 for no features', () => {
    expect(summarizeYield([])).toBe(0);
  });

  it('ignores non-numeric yields', () => {
    expect(summarizeYield([{ attributes: { stromertrag: undefined } }])).toBe(0);
  });

  it('formats kWh into MWh / GWh', () => {
    expect(formatKWh(14000)).toBe('14.0 MWh');
    expect(formatKWh(800)).toBe('800 kWh');
    expect(formatKWh(2_500_000)).toBe('2.5 GWh');
  });

  it('converts WGS84 to plausible LV95 coordinates for Zürich', () => {
    const { east, north } = wgs84ToLv95(8.5417, 47.3769);
    expect(east).toBeGreaterThan(2_600_000);
    expect(east).toBeLessThan(2_900_000);
    expect(north).toBeGreaterThan(1_100_000);
    expect(north).toBeLessThan(1_300_000);
  });
});
