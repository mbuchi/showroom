import { describe, it, expect } from 'vitest';
import { applyGwrPrefill, applyParcelPrefill } from '../publishPrefill';
import { emptyListingDraft } from '../idx/types';
import type { ParcelInfo } from '../parcelInfo';
import type { GwrBuilding, GwrDwelling } from '../gwrLookup';

const NOW = new Date('2026-07-29T10:00:00Z');

/** Full-house parcel payload; individual tests null out what they care about. */
function parcel(overrides: Partial<ParcelInfo> = {}): ParcelInfo {
  return {
    address: 'Hainerweg 6',
    locality: '8008 Zürich ZH',
    egrid: 'CH339979914032',
    buildingSizeM2: 420,
    buildingVolumeM3: 13364.21,
    flats: 12,
    zone: 'W3 Wohnzone',
    lat: 47.3568,
    lng: 8.5551,
    zip: '8008',
    city: 'Zürich',
    canton: 'ZH',
    parcelAreaM2: 6499.16,
    constructionYear: 1897,
    buildingFloors: 5,
    buildingRooms: 3.5,
    buildingCount: 4,
    pricePerM2Living: 13062.08,
    ...overrides,
  };
}

describe('applyParcelPrefill', () => {
  it('fills every mappable field into an empty draft', () => {
    const { draft, filled } = applyParcelPrefill(emptyListingDraft(), parcel(), NOW);

    expect(filled).toEqual([
      'refProperty',
      'street',
      'zip',
      'city',
      'canton',
      'surfaceProperty',
      'yearBuilt',
      'numberOfFloors',
      'rooms',
      'apartments',
      'volume',
      'oldBuilding',
    ]);
    expect(draft.refProperty).toBe('CH339979914032');
    expect(draft.street).toBe('Hainerweg 6');
    expect(draft.zip).toBe('8008');
    expect(draft.city).toBe('Zürich');
    expect(draft.canton).toBe('ZH');
    expect(draft.surfaceProperty).toBe('6499');
    expect(draft.yearBuilt).toBe('1897');
    expect(draft.numberOfFloors).toBe('5');
    expect(draft.rooms).toBe('3.5');
    expect(draft.apartments).toBe('12');
    expect(draft.volume).toBe('13364');
    expect(draft.features.oldBuilding).toBe('Y');
    expect(draft.lat).toBe(47.3568);
    expect(draft.lng).toBe(8.5551);
  });

  it('never overwrites values the user already entered', () => {
    const typed = {
      ...emptyListingDraft(),
      refProperty: 'MY-REF-1',
      street: 'Musterweg 9',
      zip: '3000',
      city: 'Bern',
      canton: 'BE',
      surfaceProperty: '900',
      yearBuilt: '1975',
      numberOfFloors: '2',
      rooms: '4.5',
      apartments: '1',
      volume: '800',
    };
    const { draft, filled } = applyParcelPrefill(typed, parcel(), NOW);

    expect(filled).toEqual(['oldBuilding']);
    expect(draft.refProperty).toBe('MY-REF-1');
    expect(draft.street).toBe('Musterweg 9');
    expect(draft.zip).toBe('3000');
    expect(draft.city).toBe('Bern');
    expect(draft.canton).toBe('BE');
    expect(draft.surfaceProperty).toBe('900');
    expect(draft.yearBuilt).toBe('1975');
    expect(draft.numberOfFloors).toBe('2');
    expect(draft.rooms).toBe('4.5');
    expect(draft.apartments).toBe('1');
    expect(draft.volume).toBe('800');
  });

  it('still updates the coordinates on an otherwise untouched draft', () => {
    const typed = { ...emptyListingDraft(), lat: 46, lng: 7 };
    const { draft } = applyParcelPrefill(typed, parcel({ constructionYear: null }), NOW);
    expect(draft.lat).toBe(47.3568);
    expect(draft.lng).toBe(8.5551);
  });

  it('skips source values the parcel payload does not carry', () => {
    const sparse = parcel({
      egrid: null,
      address: null,
      zip: null,
      city: null,
      canton: null,
      parcelAreaM2: null,
      constructionYear: null,
      buildingFloors: null,
      buildingRooms: null,
      flats: null,
      buildingVolumeM3: null,
    });
    const { draft, filled } = applyParcelPrefill(emptyListingDraft(), sparse, NOW);

    expect(filled).toEqual([]);
    expect(draft.refProperty).toBe('');
    expect(draft.street).toBe('');
    expect(draft.yearBuilt).toBe('');
    expect(draft.features.oldBuilding).toBe('');
    expect(draft.features.newBuilding).toBe('');
  });

  it('flags an old building at exactly 50 years and not at 49', () => {
    const atFifty = applyParcelPrefill(emptyListingDraft(), parcel({ constructionYear: 1976 }), NOW);
    expect(atFifty.draft.features.oldBuilding).toBe('Y');
    expect(atFifty.filled).toContain('oldBuilding');

    const atFortyNine = applyParcelPrefill(
      emptyListingDraft(),
      parcel({ constructionYear: 1977 }),
      NOW,
    );
    expect(atFortyNine.draft.features.oldBuilding).toBe('');
    expect(atFortyNine.filled).not.toContain('oldBuilding');
  });

  it('flags a new building only when it was built this year', () => {
    const thisYear = applyParcelPrefill(emptyListingDraft(), parcel({ constructionYear: 2026 }), NOW);
    expect(thisYear.draft.features.newBuilding).toBe('Y');
    expect(thisYear.filled).toContain('newBuilding');

    const lastYear = applyParcelPrefill(emptyListingDraft(), parcel({ constructionYear: 2025 }), NOW);
    expect(lastYear.draft.features.newBuilding).toBe('');
  });

  it('leaves a feature the user explicitly answered untouched', () => {
    const answered = emptyListingDraft();
    answered.features.oldBuilding = 'N';
    const { draft, filled } = applyParcelPrefill(answered, parcel({ constructionYear: 1897 }), NOW);
    expect(draft.features.oldBuilding).toBe('N');
    expect(filled).not.toContain('oldBuilding');
  });

  it('rounds the parcel area and the building volume to whole units', () => {
    const { draft } = applyParcelPrefill(
      emptyListingDraft(),
      parcel({ parcelAreaM2: 6499.64, buildingVolumeM3: 13364.5 }),
      NOW,
    );
    expect(draft.surfaceProperty).toBe('6500');
    expect(draft.volume).toBe('13365');
  });

  it('returns a new draft and never mutates the input', () => {
    const input = emptyListingDraft();
    const inputFeatures = input.features;
    const { draft } = applyParcelPrefill(input, parcel(), NOW);

    expect(draft).not.toBe(input);
    expect(draft.features).not.toBe(inputFeatures);
    expect(input.street).toBe('');
    expect(input.features.oldBuilding).toBe('');
    expect(input.lat).toBeNull();
  });

  it('treats a whitespace-only value as blank', () => {
    const spaced = { ...emptyListingDraft(), city: '   ' };
    const { draft, filled } = applyParcelPrefill(spaced, parcel(), NOW);
    expect(draft.city).toBe('Zürich');
    expect(filled).toContain('city');
  });
});

/** Register building; individual tests null out what they care about. */
function building(overrides: Partial<GwrBuilding> = {}): GwrBuilding {
  return {
    egid: '302013',
    yearBuilt: 1974,
    floors: 6,
    dwellingCount: 18,
    dwellings: [],
    ...overrides,
  };
}

/** Register dwelling — the 2nd upper floor, 4.5 rooms, 122 m2. */
function dwelling(overrides: Partial<GwrDwelling> = {}): GwrDwelling {
  return {
    ewid: '3',
    floorCode: 3102,
    floorLabel: '2',
    rooms: 4.5,
    areaM2: 122.4,
    ...overrides,
  };
}

describe('applyGwrPrefill', () => {
  it('fills the building-level fields into an empty draft', () => {
    const { draft, filled } = applyGwrPrefill(emptyListingDraft(), building(), null);

    expect(filled).toEqual(['numberOfFloors', 'apartments', 'yearBuilt']);
    expect(draft.numberOfFloors).toBe('6');
    expect(draft.apartments).toBe('18');
    expect(draft.yearBuilt).toBe('1974');
  });

  it('fills the dwelling fields when the building holds a single unit', () => {
    const { draft, filled } = applyGwrPrefill(emptyListingDraft(), building(), dwelling());

    expect(filled).toEqual([
      'numberOfFloors',
      'apartments',
      'yearBuilt',
      'surfaceLiving',
      'rooms',
      'floor',
    ]);
    expect(draft.surfaceLiving).toBe('122');
    expect(draft.rooms).toBe('4.5');
    expect(draft.floor).toBe('2');
  });

  it('writes nothing unit-specific when no dwelling is passed (the multi-unit case)', () => {
    const { draft, filled } = applyGwrPrefill(emptyListingDraft(), building(), null);

    expect(filled).not.toContain('surfaceLiving');
    expect(filled).not.toContain('rooms');
    expect(filled).not.toContain('floor');
    expect(draft.surfaceLiving).toBe('');
    expect(draft.rooms).toBe('');
    expect(draft.floor).toBe('');
  });

  it('never overwrites typed values in the default (automatic) mode', () => {
    const typed = {
      ...emptyListingDraft(),
      numberOfFloors: '2',
      apartments: '1',
      yearBuilt: '1990',
      surfaceLiving: '95',
      rooms: '3.5',
      floor: '1',
    };
    const { draft, filled } = applyGwrPrefill(typed, building(), dwelling());

    expect(filled).toEqual([]);
    expect(draft.numberOfFloors).toBe('2');
    expect(draft.apartments).toBe('1');
    expect(draft.yearBuilt).toBe('1990');
    expect(draft.surfaceLiving).toBe('95');
    expect(draft.rooms).toBe('3.5');
    expect(draft.floor).toBe('1');
  });

  it('overwrites the dwelling fields on an explicit pick, but not the building ones', () => {
    const typed = {
      ...emptyListingDraft(),
      numberOfFloors: '2',
      apartments: '1',
      yearBuilt: '1990',
      surfaceLiving: '95',
      rooms: '3.5',
      floor: '1',
    };
    const { draft, filled } = applyGwrPrefill(typed, building(), dwelling(), {
      overwriteDwellingFields: true,
    });

    expect(filled).toEqual(['surfaceLiving', 'rooms', 'floor']);
    // Picking a unit says nothing about the building itself.
    expect(draft.numberOfFloors).toBe('2');
    expect(draft.apartments).toBe('1');
    expect(draft.yearBuilt).toBe('1990');
    expect(draft.surfaceLiving).toBe('122');
    expect(draft.rooms).toBe('4.5');
    expect(draft.floor).toBe('2');
  });

  it('re-applies cleanly when the user picks a different unit', () => {
    const first = applyGwrPrefill(emptyListingDraft(), building(), dwelling(), {
      overwriteDwellingFields: true,
    });
    const second = applyGwrPrefill(
      first.draft,
      building(),
      dwelling({ ewid: '9', floorCode: 3401, floorLabel: '-1', rooms: 1.5, areaM2: 41 }),
      { overwriteDwellingFields: true },
    );

    expect(second.draft.surfaceLiving).toBe('41');
    expect(second.draft.rooms).toBe('1.5');
    expect(second.draft.floor).toBe('-1');
  });

  it('writes the ground floor as "0" rather than treating it as blank', () => {
    const { draft, filled } = applyGwrPrefill(
      emptyListingDraft(),
      building(),
      dwelling({ floorCode: 3100, floorLabel: '0' }),
    );
    expect(draft.floor).toBe('0');
    expect(filled).toContain('floor');
  });

  it('skips facts the register does not carry', () => {
    const { draft, filled } = applyGwrPrefill(
      emptyListingDraft(),
      building({ yearBuilt: null, floors: null, dwellingCount: null }),
      dwelling({ floorCode: null, floorLabel: null, rooms: null, areaM2: null }),
    );

    expect(filled).toEqual([]);
    expect(draft.numberOfFloors).toBe('');
    expect(draft.floor).toBe('');
  });

  it('tolerates a null building (register hit without a usable building)', () => {
    const { draft, filled } = applyGwrPrefill(emptyListingDraft(), null, dwelling());
    expect(filled).toEqual(['surfaceLiving', 'rooms', 'floor']);
    expect(draft.numberOfFloors).toBe('');
  });

  it('returns a new draft, never mutates the input, and leaves coordinates alone', () => {
    const input = { ...emptyListingDraft(), lat: 47.1, lng: 8.2 };
    const inputFeatures = input.features;
    const { draft } = applyGwrPrefill(input, building(), dwelling());

    expect(draft).not.toBe(input);
    expect(draft.features).not.toBe(inputFeatures);
    expect(input.numberOfFloors).toBe('');
    expect(draft.lat).toBe(47.1);
    expect(draft.lng).toBe(8.2);
  });
});
