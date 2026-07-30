import { describe, expect, it } from 'vitest';
// The REAL validator from the official package: this is what the acceptance
// test below leans on, so a mapping drift can never pass silently.
import { validateSwissRets } from '@qualipool/swissrets-json';
import { buildSwissRetsInventory, type SwissRetsBuildOptions } from '../build';
import { swissRetsCategoriesFor } from '../categoryMap';
import { emptyListingDraft, type ListingDraft } from '../../idx/types';

const OPTS: SwissRetsBuildOptions = {
  generatorVersion: '0.22.1',
  locale: 'de',
  now: new Date('2026-07-30T09:15:00.000Z'),
};

/** A draft with every mapped field populated, mirroring a real publish form. */
function filledDraft(): ListingDraft {
  const d = emptyListingDraft();
  d.offerType = 'RENT';
  d.category = 'APPT';
  d.objectType = 2;
  d.refProperty = 'CH-8001-0042';
  d.street = 'Bahnhofstrasse 12a';
  d.zip = '8001';
  d.city = 'Zürich';
  d.canton = 'zh';
  d.country = 'ch';
  d.situation = 'Zentral, ruhige Seitenstrasse';
  d.lat = 47.3769;
  d.lng = 8.5417;
  d.title = 'Maisonette mit Weitsicht';
  d.description = 'Grosszügige Maisonette-Wohnung über zwei Etagen.';
  d.availableFrom = '01.09.2026';
  d.rentNet = "2'500";
  d.rentExtra = '250';
  d.priceUnit = 'MONTHLY';
  d.currency = 'chf';
  d.floor = '-1';
  d.rooms = '4.5';
  d.surfaceLiving = '128';
  d.surfaceProperty = '340';
  d.volume = '780';
  d.yearBuilt = '1998';
  d.yearRenovated = '2019';
  d.numberOfFloors = '2';
  d.features = {
    view: 'Y',
    fireplace: 'N',
    cabletv: 'Y',
    elevator: 'Y',
    childFriendly: 'Y',
    parking: 'N',
    garage: 'Y',
    balcony: 'Y',
    wheelchair: 'N',
    animalAllowed: 'Y',
    newBuilding: 'N',
    oldBuilding: 'Y',
    swimmingpool: 'N',
    minergieGeneral: 'Y',
    minergieCertified: 'Y',
  };
  d.images = [
    {
      savedImageId: 'a1',
      publicUrl: 'https://res.zeroo.ch/images/a1.jpg',
      filename: 'a1.jpg',
      title: 'Wohnzimmer',
    },
    {
      savedImageId: 'a2',
      publicUrl: 'https://res.zeroo.ch/images/a2.jpg',
      filename: 'a2.jpg',
      title: '',
    },
  ];
  return d;
}

function minimalDraft(): ListingDraft {
  const d = emptyListingDraft();
  d.refProperty = 'REF-1';
  d.title = 'Kleines Studio';
  d.offerType = 'SALE';
  return d;
}

/** Short "instancePath: message" lines, so a failure names the offending field. */
function errorLines(inventory: Record<string, unknown>): string[] {
  return validateSwissRets(inventory as never).map(
    (e) => `${e.instancePath || '/'}: ${e.message ?? 'invalid'}`,
  );
}

describe('buildSwissRetsInventory', () => {
  it('produces an inventory the official 3.6.0 validator accepts (filled draft)', () => {
    expect(errorLines(buildSwissRetsInventory(filledDraft(), OPTS))).toEqual([]);
  });

  it('produces an inventory the official 3.6.0 validator accepts (minimal draft)', () => {
    expect(errorLines(buildSwissRetsInventory(minimalDraft(), OPTS))).toEqual([]);
  });

  it('stays valid for every distinct mapping in the IDX category table', () => {
    // Walks the whole category/objectType grid but validates one draft per
    // distinct mapping result, so the categoryMap characteristic branch cannot
    // smuggle an unknown property name past additionalProperties:false.
    const categories: ListingDraft['category'][] = [
      'APPT',
      'HOUSE',
      'PROP',
      'PARK',
      'INDUS',
      'GASTRO',
      'AGRI',
      'GARDEN',
      'SECONDARY',
    ];
    const seen = new Set<string>();
    for (const category of categories) {
      for (let objectType = 0; objectType <= 38; objectType++) {
        const mapping = swissRetsCategoriesFor(category, objectType);
        const signature = `${mapping.categories.join(',')}|${mapping.characteristic ?? ''}`;
        if (seen.has(signature)) continue;
        seen.add(signature);
        const d = filledDraft();
        d.category = category;
        d.objectType = objectType;
        expect(errorLines(buildSwissRetsInventory(d, OPTS)), `${category}/${objectType}`).toEqual(
          [],
        );
      }
    }
    // Guard against the loop silently collapsing to a single mapping.
    expect(seen.size).toBeGreaterThan(30);
  });

  it('sets the envelope: created, generator and a single property', () => {
    const inv = buildSwissRetsInventory(filledDraft(), OPTS) as {
      created: string;
      generator: { name: string; version: string };
      properties: unknown[];
    };
    expect(inv.created).toBe('2026-07-30T09:15:00.000Z');
    expect(inv.generator).toEqual({ name: 'Aireon Showroom', version: '0.22.1' });
    expect(inv.properties).toHaveLength(1);
  });

  it('carries refProperty into id, referenceId and externalReference', () => {
    const p = property(buildSwissRetsInventory(filledDraft(), OPTS));
    expect(p.id).toBe('CH-8001-0042');
    expect(p.referenceId).toBe('CH-8001-0042');
    expect(p.externalReference).toEqual({ refProperty: 'CH-8001-0042' });
  });

  it('falls back to listing-1 and drops externalReference when refProperty is blank', () => {
    const d = minimalDraft();
    d.refProperty = '   ';
    const p = property(buildSwissRetsInventory(d, OPTS));
    expect(p.id).toBe('listing-1');
    expect(p.referenceId).toBe('listing-1');
    expect(p).not.toHaveProperty('externalReference');
  });

  it('maps the offer type: SALE to buy, RENT to rent', () => {
    expect(property(buildSwissRetsInventory(minimalDraft(), OPTS)).type).toBe('buy');
    expect(property(buildSwissRetsInventory(filledDraft(), OPTS)).type).toBe('rent');
  });

  it('maps APPT/2 to the apartment + maisonette category pair', () => {
    expect(property(buildSwissRetsInventory(filledDraft(), OPTS)).categories).toEqual([
      'apartment',
      'maisonette',
    ]);
  });

  it('omits the categories key for an officially unmapped object type', () => {
    const d = minimalDraft();
    d.category = 'PROP';
    d.objectType = 1;
    expect(property(buildSwissRetsInventory(d, OPTS))).not.toHaveProperty('categories');
  });

  it('applies the categoryMap characteristic (name = value form) alongside the categories', () => {
    const d = minimalDraft();
    d.category = 'PARK';
    d.objectType = 1;
    const c = characteristics(buildSwissRetsInventory(d, OPTS));
    expect(c.isUnderRoof).toBe('does-not-apply');
  });

  it('maps the tri-state features: Y applies, N does-not-apply, blank absent', () => {
    const c = characteristics(buildSwissRetsInventory(filledDraft(), OPTS));
    expect(c.hasNiceView).toBe('applies');
    expect(c.hasFireplace).toBe('does-not-apply');
    expect(c.hasCableTv).toBe('applies');
    expect(c.hasElevator).toBe('applies');
    expect(c.isChildFriendly).toBe('applies');
    expect(c.hasParking).toBe('does-not-apply');
    expect(c.hasGarage).toBe('applies');
    expect(c.hasBalcony).toBe('applies');
    expect(c.isWheelchairAccessible).toBe('does-not-apply');
    expect(c.arePetsAllowed).toBe('applies');
    expect(c.isNewConstruction).toBe('does-not-apply');
    expect(c.isOldBuilding).toBe('applies');
    expect(c.hasSwimmingPool).toBe('does-not-apply');
    const blank = characteristics(buildSwissRetsInventory(minimalDraft(), OPTS));
    expect(blank).not.toHaveProperty('hasNiceView');
    expect(blank).not.toHaveProperty('hasBalcony');
  });

  it('maps the numeric characteristics, keeping room halves and a negative floor', () => {
    const c = characteristics(buildSwissRetsInventory(filledDraft(), OPTS));
    expect(c.numberOfRooms).toBe(4.5);
    expect(c.floor).toBe(-1);
    expect(c.numberOfFloors).toBe(2);
    expect(c.areaBwf).toBe(128);
    expect(c.areaPropertyLand).toBe(340);
    expect(c.volumeGva).toBe(780);
    expect(c.yearBuilt).toBe(1998);
    expect(c.yearLastRenovated).toBe(2019);
  });

  it('sets minergieCertification only for a certified listing', () => {
    expect(property(buildSwissRetsInventory(filledDraft(), OPTS)).minergieCertification).toBe(
      'Minergie',
    );
    const d = filledDraft();
    d.features.minergieCertified = '';
    // minergieGeneral alone has no SwissRETS slot, so it must not leak a value.
    d.features.minergieGeneral = 'Y';
    expect(property(buildSwissRetsInventory(d, OPTS))).not.toHaveProperty('minergieCertification');
  });

  it('builds the address with an uppercase country code and geo coordinates', () => {
    const p = property(buildSwissRetsInventory(filledDraft(), OPTS));
    expect(p.address).toEqual({
      countryCode: 'CH',
      locality: 'Zürich',
      postalCode: '8001',
      street: 'Bahnhofstrasse 12a',
      region: 'ZH',
      geo: { latitude: 47.3769, longitude: 8.5417 },
    });
  });

  it('emits exactly one localization with the requested language code', () => {
    const p = property(buildSwissRetsInventory(filledDraft(), { ...OPTS, locale: 'fr' }));
    expect(p.localizations).toHaveLength(1);
    const loc = p.localizations[0];
    expect(loc.languageCode).toBe('fr');
    expect(loc.title).toBe('Maisonette mit Weitsicht');
    expect(loc.description).toBe('Grosszügige Maisonette-Wohnung über zwei Etagen.');
    expect(loc.location).toBe('Zentral, ruhige Seitenstrasse');
    expect(loc.attachments).toEqual({
      images: [
        { url: 'https://res.zeroo.ch/images/a1.jpg', title: 'Wohnzimmer' },
        { url: 'https://res.zeroo.ch/images/a2.jpg' },
      ],
    });
  });

  it('omits attachments when the listing has no images', () => {
    const p = property(buildSwissRetsInventory(minimalDraft(), OPTS));
    expect(p.localizations[0]).not.toHaveProperty('attachments');
  });

  it('computes the gross rent as net + extra and carries the interval', () => {
    const prices = property(buildSwissRetsInventory(filledDraft(), OPTS)).prices;
    expect(prices).toEqual({
      currency: 'CHF',
      rent: { net: 2500, extra: 250, gross: 2750, interval: 'month' },
    });
  });

  it('flags an m2 yearly rent with referring m2 and a year interval', () => {
    const d = filledDraft();
    d.priceUnit = 'M2YEARLY';
    const prices = property(buildSwissRetsInventory(d, OPTS)).prices;
    expect(prices.rent).toEqual({
      net: 2500,
      extra: 250,
      gross: 2750,
      interval: 'year',
      referring: 'm2',
    });
  });

  it('emits a buy price for a sale, with referring m2 for a per-m2 unit', () => {
    const d = minimalDraft();
    d.sellingPrice = "1'250'000";
    expect(property(buildSwissRetsInventory(d, OPTS)).prices).toEqual({
      currency: 'CHF',
      buy: { price: 1250000 },
    });
    d.priceUnit = 'SELLM2';
    expect(property(buildSwissRetsInventory(d, OPTS)).prices.buy).toEqual({
      price: 1250000,
      referring: 'm2',
    });
  });

  it('omits prices entirely when there is no price (price on request)', () => {
    expect(property(buildSwissRetsInventory(minimalDraft(), OPTS))).not.toHaveProperty('prices');
  });

  it('converts a DD.MM.YYYY availability date to an ISO start', () => {
    const p = property(buildSwissRetsInventory(filledDraft(), OPTS));
    expect(p.availability).toEqual({ state: 'active', start: '2026-09-01T00:00:00Z' });
  });

  it('keeps availability at state only when the date is missing or malformed', () => {
    expect(property(buildSwissRetsInventory(minimalDraft(), OPTS)).availability).toEqual({
      state: 'active',
    });
    const d = filledDraft();
    d.availableFrom = 'nach Vereinbarung';
    expect(property(buildSwissRetsInventory(d, OPTS)).availability).toEqual({ state: 'active' });
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
function property(inventory: Record<string, unknown>): any {
  return (inventory as any).properties[0];
}

function characteristics(inventory: Record<string, unknown>): any {
  return property(inventory).characteristics ?? {};
}
/* eslint-enable @typescript-eslint/no-explicit-any */
