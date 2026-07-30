import { describe, it, expect } from 'vitest';
import { describeDwelling, floorName, type Translate } from '../gwrLabels';
import type { GwrDwelling } from '../gwrLookup';

/** Stand-in for the real `t`: echoes the key plus its interpolated vars, so a
 *  test asserts WHICH key was used rather than the English copy. */
const t: Translate = (key, vars) => {
  const suffix = key.replace('page.publish.gwr.', '');
  if (!vars) return suffix;
  const rendered = Object.entries(vars)
    .map(([name, value]) => `${name}=${value}`)
    .join('|');
  return `${suffix}(${rendered})`;
};

function dwelling(overrides: Partial<GwrDwelling> = {}): GwrDwelling {
  return { ewid: '3', floorCode: 3102, floorLabel: '2', rooms: 4.5, areaM2: 122.4, ...overrides };
}

describe('floorName', () => {
  it('names the ground floor, the upper floors and the basements from i18n keys', () => {
    expect(floorName(t, 3100)).toBe('groundFloor');
    expect(floorName(t, 3101)).toBe('upperFloor(n=1)');
    expect(floorName(t, 3104)).toBe('upperFloor(n=4)');
    expect(floorName(t, 3401)).toBe('basement(n=1)');
    expect(floorName(t, 3403)).toBe('basement(n=3)');
  });

  it('returns null for an unknown or missing floor code', () => {
    expect(floorName(t, null)).toBeNull();
    expect(floorName(t, 9999)).toBeNull();
  });
});

describe('describeDwelling', () => {
  it('uses the full unit label when floor, rooms and area are all known', () => {
    expect(describeDwelling(t, dwelling())).toBe('unitLabel(floor=upperFloor(n=2)|rooms=4.5|area=122)');
  });

  it('joins only the parts a partial register row carries', () => {
    expect(describeDwelling(t, dwelling({ areaM2: null }))).toBe('upperFloor(n=2), rooms(n=4.5)');
    expect(describeDwelling(t, dwelling({ floorCode: null, rooms: null }))).toBe('area(n=122)');
  });

  it('falls back to the EWID when the register carries nothing about the unit', () => {
    const bare = dwelling({ ewid: '17', floorCode: null, rooms: null, areaM2: null });
    expect(describeDwelling(t, bare)).toBe('unit(n=17)');
  });
});
