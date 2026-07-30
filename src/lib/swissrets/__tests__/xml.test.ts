import { describe, expect, it } from 'vitest';
import { buildSwissRetsInventory, type SwissRetsBuildOptions } from '../build';
import { serializeSwissRetsXml } from '../xml';
import { emptyListingDraft, type ListingDraft } from '../../idx/types';

const OPTS: SwissRetsBuildOptions = {
  generatorVersion: '0.22.1',
  locale: 'de',
  now: new Date('2026-07-30T09:15:00.000Z'),
};

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
  d.situation = 'Zentral & ruhig';
  d.lat = 47.3769;
  d.lng = 8.5417;
  d.title = 'Loft "Nord" & <Süd>';
  d.description = 'Zwei Etagen & viel Licht.';
  d.availableFrom = '01.09.2026';
  d.rentNet = '2500';
  d.rentExtra = '250';
  d.priceUnit = 'MONTHLY';
  d.floor = '-1';
  d.rooms = '4.5';
  d.surfaceLiving = '128';
  d.yearBuilt = '1998';
  d.features.view = 'Y';
  d.features.fireplace = 'N';
  d.features.minergieCertified = 'Y';
  d.images = [
    {
      savedImageId: 'a1',
      publicUrl: 'https://res.zeroo.ch/images/a1.jpg?w=1600&h=900',
      filename: 'a1.jpg',
      title: 'Wohnzimmer & Küche',
    },
  ];
  return d;
}

function parse(xml: string): Document {
  return new DOMParser().parseFromString(xml, 'application/xml');
}

function xmlFor(draft: ListingDraft, opts: SwissRetsBuildOptions = OPTS): string {
  return serializeSwissRetsXml(buildSwissRetsInventory(draft, opts));
}

describe('serializeSwissRetsXml', () => {
  it('parses as well-formed XML with no parsererror node', () => {
    const doc = parse(xmlFor(filledDraft()));
    expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
    expect(doc.documentElement.nodeName).toBe('export');
  });

  it('declares the 2.7.0 schema location and the generator envelope', () => {
    const xml = xmlFor(filledDraft());
    expect(xml.startsWith('<?xml version="1.0" encoding="utf-8"?>')).toBe(true);
    expect(xml).toContain(
      'xsi:noNamespaceSchemaLocation="https://swissrets.ch/dist/v2.7.0/schema.xsd"',
    );
    const doc = parse(xml);
    expect(doc.querySelector('created')?.textContent).toBe('2026-07-30T09:15:00.000Z');
    const gen = doc.querySelector('generator');
    expect(gen?.getAttribute('version')).toBe('0.22.1');
    expect(gen?.textContent).toBe('Aireon Showroom');
  });

  it('writes the property id as an attribute', () => {
    expect(xmlFor(filledDraft())).toContain('<property id="CH-8001-0042">');
    const p = parse(xmlFor(filledDraft())).querySelector('properties > property');
    expect(p?.getAttribute('id')).toBe('CH-8001-0042');
    expect(p?.querySelector('referenceId')?.textContent).toBe('CH-8001-0042');
    expect(p?.querySelector('type')?.textContent).toBe('rent');
  });

  it('renames the localization title to name and keeps lang on the element', () => {
    const loc = parse(xmlFor(filledDraft())).querySelector('localization');
    expect(loc?.getAttribute('lang')).toBe('de');
    expect(loc?.querySelector('name')?.textContent).toBe('Loft "Nord" & <Süd>');
    // Direct children only: an image attachment legitimately carries a <title>.
    const childTags = Array.from(loc?.children ?? []).map((el) => el.tagName);
    expect(childTags).toContain('name');
    expect(childTags).not.toContain('title');
    expect(loc?.querySelector('location')?.textContent).toBe('Zentral & ruhig');
  });

  it('escapes &, < and " in text and in attribute values', () => {
    const xml = xmlFor(filledDraft());
    expect(xml).toContain('<name>Loft &quot;Nord&quot; &amp; &lt;Süd&gt;</name>');
    expect(xml).not.toMatch(/<name>[^<]*&(?!amp;|lt;|gt;|quot;|apos;)/);
    expect(xml).toContain('https://res.zeroo.ch/images/a1.jpg?w=1600&amp;h=900');
  });

  it('drops externalReference, which SwissRETS XML 2.7.0 does not define', () => {
    const xml = xmlFor(filledDraft());
    expect(xml).not.toContain('externalReference');
    expect(parse(xml).querySelector('externalReference')).toBeNull();
  });

  it('drops the shared-apartment category that 2.7.0 lacks', () => {
    const inventory = buildSwissRetsInventory(filledDraft(), OPTS) as {
      properties: { categories: string[] }[];
    };
    inventory.properties[0].categories = ['shared-apartment', 'apartment'];
    const doc = parse(serializeSwissRetsXml(inventory as unknown as Record<string, unknown>));
    const values = Array.from(doc.querySelectorAll('categories > category')).map(
      (n) => n.textContent,
    );
    expect(values).toEqual(['apartment']);
  });

  it('omits the categories wrapper when every category was dropped', () => {
    const inventory = buildSwissRetsInventory(filledDraft(), OPTS) as {
      properties: { categories: string[] }[];
    };
    inventory.properties[0].categories = ['shared-apartment'];
    const doc = parse(serializeSwissRetsXml(inventory as unknown as Record<string, unknown>));
    expect(doc.querySelector('categories')).toBeNull();
  });

  it('writes availability state as text with start as an attribute', () => {
    const a = parse(xmlFor(filledDraft())).querySelector('availability');
    expect(a?.textContent).toBe('active');
    expect(a?.getAttribute('start')).toBe('2026-09-01T00:00:00Z');
  });

  it('writes prices with currency, interval and referring as attributes', () => {
    const d = filledDraft();
    d.priceUnit = 'M2YEARLY';
    const doc = parse(xmlFor(d));
    const prices = doc.querySelector('prices');
    expect(prices?.getAttribute('currency')).toBe('CHF');
    const rent = prices?.querySelector('rent');
    expect(rent?.getAttribute('interval')).toBe('year');
    expect(rent?.getAttribute('referring')).toBe('m2');
    expect(rent?.querySelector('net')?.textContent).toBe('2500');
    expect(rent?.querySelector('extra')?.textContent).toBe('250');
    expect(rent?.querySelector('gross')?.textContent).toBe('2750');
  });

  it('writes buy prices for a sale listing', () => {
    const d = emptyListingDraft();
    d.refProperty = 'S-1';
    d.title = 'Haus';
    d.sellingPrice = '1250000';
    const buy = parse(xmlFor(d)).querySelector('prices > buy');
    expect(buy?.querySelector('price')?.textContent).toBe('1250000');
  });

  it('serializes characteristics as elements, including a negative floor', () => {
    const c = parse(xmlFor(filledDraft())).querySelector('characteristics');
    expect(c?.querySelector('hasNiceView')?.textContent).toBe('applies');
    expect(c?.querySelector('hasFireplace')?.textContent).toBe('does-not-apply');
    expect(c?.querySelector('numberOfRooms')?.textContent).toBe('4.5');
    expect(c?.querySelector('floor')?.textContent).toBe('-1');
    expect(c?.querySelector('areaBwf')?.textContent).toBe('128');
    expect(c?.querySelector('yearBuilt')?.textContent).toBe('1998');
  });

  it('renders one image element per attachment with url and title children', () => {
    const images = parse(xmlFor(filledDraft())).querySelectorAll(
      'localization > attachments > image',
    );
    expect(images).toHaveLength(1);
    expect(images[0].querySelector('url')?.textContent).toBe(
      'https://res.zeroo.ch/images/a1.jpg?w=1600&h=900',
    );
    expect(images[0].querySelector('title')?.textContent).toBe('Wohnzimmer & Küche');
  });

  it('keeps UTF-8 characters intact instead of transliterating them', () => {
    const doc = parse(xmlFor(filledDraft()));
    expect(doc.querySelector('address > locality')?.textContent).toBe('Zürich');
    expect(doc.querySelector('minergieCertification')?.textContent).toBe('Minergie');
  });

  it('serializes a minimal inventory without optional blocks', () => {
    const d = emptyListingDraft();
    d.refProperty = 'M-1';
    d.title = 'Studio';
    // emptyListingDraft defaults country to 'CH'; clear it so no address at all.
    d.country = '';
    const doc = parse(xmlFor(d));
    expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
    expect(doc.querySelector('prices')).toBeNull();
    expect(doc.querySelector('address')).toBeNull();
    expect(doc.querySelector('characteristics')).toBeNull();
    expect(doc.querySelector('localization > name')?.textContent).toBe('Studio');
  });
});
