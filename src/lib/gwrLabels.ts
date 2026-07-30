// Human-readable labels for federal register (GWR) dwellings.
//
// Split out of the picker component so the branching — ground floor vs. upper
// floor vs. basement, and the partial rows the register is full of — is
// testable without React. `t` is injected rather than imported so these stay
// pure and locale-agnostic: every visible word comes from an i18n key.

import { wstwkToFloor, type GwrDwelling } from './gwrLookup';

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

/**
 * Locale-aware floor name for a register floor code.
 *
 * Distinct from `wstwkToFloor`, which returns the LOCALE-FREE numeric string
 * ('0', '2', '-1') written into the listing's `floor` field. This is the same
 * code rendered for a human, and is never written into the draft.
 */
export function floorName(t: Translate, floorCode: number | null): string | null {
  const numeric = wstwkToFloor(floorCode);
  if (numeric === null) return null;
  const level = Number(numeric);
  if (level === 0) return t('page.publish.gwr.groundFloor');
  if (level > 0) return t('page.publish.gwr.upperFloor', { n: level });
  return t('page.publish.gwr.basement', { n: -level });
}

/**
 * One-line description of a unit: floor, rooms, living space.
 *
 * Register rows are frequently partial, so anything the register does not carry
 * is left out rather than shown as an empty slot. A row with nothing at all
 * still gets a label, because the user has to be able to tell the rows apart.
 */
export function describeDwelling(t: Translate, dwelling: GwrDwelling): string {
  const floor = floorName(t, dwelling.floorCode);
  const { rooms, areaM2 } = dwelling;

  if (floor !== null && rooms !== null && areaM2 !== null) {
    return t('page.publish.gwr.unitLabel', { floor, rooms, area: Math.round(areaM2) });
  }

  const parts: string[] = [];
  if (floor !== null) parts.push(floor);
  if (rooms !== null) parts.push(t('page.publish.gwr.rooms', { n: rooms }));
  if (areaM2 !== null) parts.push(t('page.publish.gwr.area', { n: Math.round(areaM2) }));
  if (parts.length === 0) return t('page.publish.gwr.unit', { n: dwelling.ewid });
  return parts.join(', ');
}
