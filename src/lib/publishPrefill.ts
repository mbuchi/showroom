// Maps RES parcel facts onto an IDX listing draft.
//
// Pure and side-effect free so the fill rules — which decide what a publisher
// sees pre-typed in their listing — are unit-testable without React, the
// network or a clock. The one rule that governs everything here: a prefill
// only ever FILLS BLANKS. Whatever the user typed always wins, because losing
// typed copy to a background lookup is far worse than an unfilled field.

import type { ParcelInfo } from './parcelInfo';
import type { GwrBuilding, GwrDwelling } from './gwrLookup';
import type { ListingDraft } from './idx/types';

export interface PrefillOutcome {
  /** New draft object — the input is never mutated. */
  draft: ListingDraft;
  /** Draft field names actually written, in fill order. Feature flags appear
   *  under their ListingFeatures key ('oldBuilding' / 'newBuilding'), so the
   *  UI can label each entry from the form's existing field/feature labels. */
  filled: string[];
}

/** Draft keys holding a plain string that a prefill source may fill. */
type PrefillableKey =
  | 'refProperty'
  | 'street'
  | 'zip'
  | 'city'
  | 'canton'
  | 'surfaceProperty'
  | 'surfaceLiving'
  | 'floor'
  | 'yearBuilt'
  | 'numberOfFloors'
  | 'rooms'
  | 'apartments'
  | 'volume';

/** Age at which the portals consider a building an "old building" (Altbau). */
const OLD_BUILDING_AGE_YEARS = 50;

/** Whole-unit form string for an area/volume, else null. */
function rounded(value: number | null): string | null {
  return value === null ? null : String(Math.round(value));
}

/** Form string for a count, else null. Counts keep their decimals (rooms are
 *  half-steps in Switzerland: 3.5, 4.5). */
function counted(value: number | null): string | null {
  return value === null ? null : String(value);
}

/**
 * Fill an IDX listing draft from the parcel facts RES knows about a location.
 *
 * `now` is injected rather than read from the clock so the age-derived feature
 * flags below are deterministic in tests.
 */
export function applyParcelPrefill(
  draft: ListingDraft,
  info: ParcelInfo,
  now: Date,
): PrefillOutcome {
  // Coordinates are the one unconditional write: they identify the point the
  // user just picked, carry no typed content, and are not "a filled field" the
  // summary should brag about.
  const next: ListingDraft = {
    ...draft,
    features: { ...draft.features },
    lat: info.lat,
    lng: info.lng,
  };
  const filled: string[] = [];

  const fill = (key: PrefillableKey, value: string | null) => {
    if (value === null || value === '') return;
    if (next[key].trim() !== '') return;
    next[key] = value;
    filled.push(key);
  };

  fill('refProperty', info.egrid);
  fill('street', info.address);
  fill('zip', info.zip);
  fill('city', info.city);
  fill('canton', info.canton);
  fill('surfaceProperty', rounded(info.parcelAreaM2));
  fill('yearBuilt', counted(info.constructionYear));
  fill('numberOfFloors', counted(info.buildingFloors));
  fill('rooms', counted(info.buildingRooms));
  fill('apartments', counted(info.flats));
  fill('volume', rounded(info.buildingVolumeM3));

  // Age-derived feature flags. Only ever set 'Y': an explicit 'N' is a user
  // statement, and '' means "no statement", which the flags below may claim.
  const built = info.constructionYear;
  if (built !== null) {
    const flag = (key: 'oldBuilding' | 'newBuilding') => {
      if (next.features[key] !== '') return;
      next.features[key] = 'Y';
      filled.push(key);
    };
    if (built <= now.getFullYear() - OLD_BUILDING_AGE_YEARS) flag('oldBuilding');
    if (built === now.getFullYear()) flag('newBuilding');
  }

  return { draft: next, filled };
}

export interface GwrPrefillOptions {
  /**
   * Let the dwelling fields (surfaceLiving, rooms, floor) overwrite values that
   * are already there.
   *
   * OFF for the automatic pass, which obeys the same blank-only invariant as
   * applyParcelPrefill: a background lookup must never eat typed copy.
   *
   * ON for an explicit pick in the dwelling picker. There the user has just
   * pointed at one specific unit in the building, which is a direct statement
   * that the listing IS that unit — so its living space, room count and floor
   * replace whatever a previous auto-fill or an earlier pick left behind.
   * Without this, picking a second unit after the first would silently keep the
   * first unit's numbers, which is worse than any overwrite.
   *
   * Building-level fields stay blank-only in BOTH modes: picking a unit says
   * nothing about the building's year, floor count or apartment total.
   */
  overwriteDwellingFields?: boolean;
}

/**
 * Fill an IDX listing draft from the federal building and dwelling register.
 *
 * `building` supplies the building-level facts, `dwelling` the unit-level ones.
 * Pass `dwelling` as null when the building holds several units and the user
 * has not picked one yet — guessing a unit would put a stranger's living space
 * into someone's listing.
 */
export function applyGwrPrefill(
  draft: ListingDraft,
  building: GwrBuilding | null,
  dwelling: GwrDwelling | null,
  options: GwrPrefillOptions = {},
): PrefillOutcome {
  const next: ListingDraft = { ...draft, features: { ...draft.features } };
  const filled: string[] = [];

  /** Blank-only write — whatever the user typed wins. */
  const fill = (key: PrefillableKey, value: string | null) => {
    if (value === null || value === '') return;
    if (next[key].trim() !== '') return;
    next[key] = value;
    filled.push(key);
  };

  /** Unconditional write, used only on an explicit dwelling pick. */
  const force = (key: PrefillableKey, value: string | null) => {
    if (value === null || value === '') return;
    next[key] = value;
    filled.push(key);
  };

  if (building) {
    fill('numberOfFloors', counted(building.floors));
    fill('apartments', counted(building.dwellingCount));
    fill('yearBuilt', counted(building.yearBuilt));
  }

  if (dwelling) {
    const write = options.overwriteDwellingFields ? force : fill;
    write('surfaceLiving', rounded(dwelling.areaM2));
    write('rooms', counted(dwelling.rooms));
    write('floor', dwelling.floorLabel);
  }

  return { draft: next, filled };
}
