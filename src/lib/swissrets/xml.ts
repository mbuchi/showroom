// SwissRETS XML 2.7.0 serializer for the inventory produced by `build.ts`.
//
// 2.7.0 is the version the live rails still consume (newhome FTP interface,
// CASAGATEWAY, the SMG import gateway), so the same internal model is written
// twice. Deltas against JSON 3.6.0, each verified against schema.xsd and the
// official examples:
//   - `externalReference` does not exist in 2.7.0 and is dropped.
//   - The `shared-apartment` category is missing from the 2.7.0 enum.
//   - The localization `title` is called `<name>`, and the language is a `lang`
//     attribute on `<localization>`.
//   - `availability` is element text with start/expiration as attributes; the
//     price currency/interval/referring likewise live in attributes.
//   - Every complexType here is `xs:all`, so element order is not binding, but
//     the output follows the order of examples/full.xml for reviewability.
//
// XML has no Latin-1 restriction, so the IDX transliterator is deliberately NOT
// applied: the document is plain UTF-8.

const SCHEMA_LOCATION = 'https://swissrets.ch/dist/v2.7.0/schema.xsd';

/** Categories defined in JSON 3.6.0 but absent from the XML 2.7.0 enum. */
const CATEGORIES_NOT_IN_2_7 = new Set(['shared-apartment']);

/** Escapes the five predefined entities, used for both text and attributes. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function asObject(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asText(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

type Attributes = Record<string, string | undefined>;

function attrString(attributes: Attributes | undefined): string {
  if (!attributes) return '';
  return Object.entries(attributes)
    .filter((entry): entry is [string, string] => entry[1] !== undefined)
    .map(([name, value]) => ` ${name}="${escapeXml(value)}"`)
    .join('');
}

class XmlWriter {
  private readonly lines: string[] = [];

  constructor(private depth = 0) {}

  open(name: string, attributes?: Attributes): void {
    this.lines.push(`${this.pad()}<${name}${attrString(attributes)}>`);
    this.depth += 1;
  }

  close(name: string): void {
    this.depth -= 1;
    this.lines.push(`${this.pad()}</${name}>`);
  }

  /** Writes a text element; a nullish value writes nothing at all. */
  leaf(name: string, value: unknown, attributes?: Attributes): void {
    const text = asText(value);
    if (text === undefined) return;
    this.lines.push(
      `${this.pad()}<${name}${attrString(attributes)}>${escapeXml(text)}</${name}>`,
    );
  }

  raw(line: string): void {
    this.lines.push(`${this.pad()}${line}`);
  }

  toString(): string {
    return this.lines.join('\n');
  }

  private pad(): string {
    return '  '.repeat(this.depth);
  }
}

function writeAddress(w: XmlWriter, address: Record<string, unknown>): void {
  w.open('address');
  w.leaf('countryCode', address.countryCode);
  w.leaf('locality', address.locality);
  w.leaf('region', address.region);
  w.leaf('postalCode', address.postalCode);
  w.leaf('street', address.street);
  const geo = asObject(address.geo);
  if (geo) {
    w.open('geo');
    w.leaf('latitude', geo.latitude);
    w.leaf('longitude', geo.longitude);
    w.close('geo');
  }
  w.close('address');
}

function writeCharacteristics(w: XmlWriter, characteristics: Record<string, unknown>): void {
  // Alphabetical, matching examples/full.xml; xs:all leaves order free.
  const names = Object.keys(characteristics).sort();
  if (names.length === 0) return;
  w.open('characteristics');
  for (const name of names) w.leaf(name, characteristics[name]);
  w.close('characteristics');
}

function writeAttachments(w: XmlWriter, attachments: Record<string, unknown>): void {
  const images = asArray(attachments.images)
    .map(asObject)
    .filter((image): image is Record<string, unknown> => Boolean(image));
  if (images.length === 0) return;
  w.open('attachments');
  for (const image of images) {
    w.open('image');
    w.leaf('url', image.url);
    w.leaf('title', image.title);
    w.leaf('description', image.description);
    w.leaf('mimeType', image.mimeType);
    w.close('image');
  }
  w.close('attachments');
}

function writeLocalizations(w: XmlWriter, localizations: unknown[]): void {
  const entries = localizations
    .map(asObject)
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
  if (entries.length === 0) return;
  w.open('localizations');
  for (const entry of entries) {
    w.open('localization', { lang: asText(entry.languageCode) ?? 'de' });
    // `name` is the 2.7.0 spelling of the JSON `title`, and it is required.
    w.leaf('name', asText(entry.title) ?? '');
    w.leaf('excerpt', entry.excerpt);
    w.leaf('description', entry.description);
    w.leaf('location', entry.location);
    w.leaf('equipment', entry.equipment);
    const attachments = asObject(entry.attachments);
    if (attachments) writeAttachments(w, attachments);
    w.close('localization');
  }
  w.close('localizations');
}

function writePrices(w: XmlWriter, prices: Record<string, unknown>): void {
  const rent = asObject(prices.rent);
  const buy = asObject(prices.buy);
  if (!rent && !buy) return;
  w.open('prices', { currency: asText(prices.currency) });
  if (rent) {
    w.open('rent', {
      interval: asText(rent.interval),
      referring: asText(rent.referring),
    });
    w.leaf('gross', rent.gross);
    w.leaf('net', rent.net);
    w.leaf('extra', rent.extra);
    w.close('rent');
  }
  if (buy) {
    w.open('buy', { referring: asText(buy.referring) });
    w.leaf('price', buy.price);
    w.leaf('extra', buy.extra);
    w.close('buy');
  }
  w.close('prices');
}

function writeProperty(w: XmlWriter, property: Record<string, unknown>): void {
  w.open('property', { id: asText(property.id) ?? '' });

  const address = asObject(property.address);
  if (address) writeAddress(w, address);

  const availability = asObject(property.availability);
  if (availability) {
    w.leaf('availability', asText(availability.state) ?? 'active', {
      start: asText(availability.start),
      expiration: asText(availability.expiration),
    });
  }

  const categories = asArray(property.categories)
    .map(asText)
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .filter((value) => !CATEGORIES_NOT_IN_2_7.has(value));
  if (categories.length > 0) {
    w.open('categories');
    for (const category of categories) w.leaf('category', category);
    w.close('categories');
  }

  const characteristics = asObject(property.characteristics);
  if (characteristics) writeCharacteristics(w, characteristics);

  writeLocalizations(w, asArray(property.localizations));

  w.leaf('minergieCertification', property.minergieCertification);

  const prices = asObject(property.prices);
  if (prices) writePrices(w, prices);

  w.leaf('referenceId', property.referenceId);
  w.leaf('type', property.type);

  w.close('property');
}

/**
 * Serializes a SwissRETS inventory (as produced by `buildSwissRetsInventory`)
 * to a SwissRETS XML 2.7.0 document.
 */
export function serializeSwissRetsXml(inventory: Record<string, unknown>): string {
  const w = new XmlWriter();
  w.raw('<?xml version="1.0" encoding="utf-8"?>');
  w.open('export', {
    'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    'xsi:noNamespaceSchemaLocation': SCHEMA_LOCATION,
  });

  w.leaf('created', inventory.created);

  const generator = asObject(inventory.generator);
  if (generator) {
    w.leaf('generator', asText(generator.name) ?? '', {
      version: asText(generator.version),
    });
  }

  const properties = asArray(inventory.properties)
    .map(asObject)
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
  if (properties.length > 0) {
    w.open('properties');
    for (const property of properties) writeProperty(w, property);
    w.close('properties');
  }

  w.close('export');
  return `${w.toString()}\n`;
}
