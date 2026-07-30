// SwissRETS inventory builder: turns the publish-page ListingDraft into the
// single internal model that both output tracks are serialized from -
// swissrets/export.json (SwissRETS JSON 3.6.0, the actively developed standard)
// and swissrets/export.xml (SwissRETS XML 2.7.0, what newhome, CASAGATEWAY and
// the SMG gateway consume today).
//
// The JSON Schema sets `additionalProperties: false` on every object, so this
// builder emits ONLY fields it can fill: an absent source value means the key
// is omitted, never emitted empty. Property names below were each verified
// against schema/swissRetsSchema.json (3.6.0) and schema.xsd (2.7.0).
import type { ListingDraft, PriceUnit, YesNo } from '../idx/types';
import { swissRetsCategoriesFor } from './categoryMap';

export interface SwissRetsBuildOptions {
  /** App version, written into the generator envelope. */
  generatorVersion: string;
  /** UI locale; the first two letters become the localization languageCode. */
  locale: string;
  /** Export timestamp, written into `created`. */
  now: Date;
}

/** SwissRETS `applicableType`; the third state, 'unknown', is never emitted -
 *  an IDX blank means "no statement", which the schema expresses by omission. */
type Applicable = 'applies' | 'does-not-apply';

const APPLICABLE_VALUES = new Set<string>(['applies', 'does-not-apply', 'unknown']);

/** IDX tri-state to SwissRETS applicableType. Blank stays undefined (omit). */
function applicable(value: YesNo): Applicable | undefined {
  if (value === 'Y') return 'applies';
  if (value === 'N') return 'does-not-apply';
  return undefined;
}

/** Trimmed string, or undefined when the source is blank. */
function text(value: string | undefined | null): string | undefined {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Digit-cleaned positive integer ("2'500" -> 2500). Zero is treated as absent:
 * the JSON schema allows 0 but XML 2.7.0 types these as positiveInteger /
 * positiveDecimal (minExclusive 0), and one model feeds both serializers.
 */
function positiveInt(value: string): number | undefined {
  const digits = value.replace(/\D+/g, '');
  if (!digits) return undefined;
  const parsed = Number(digits);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/** Positive decimal accepting room halves in either notation ("4.5", "4,5"). */
function positiveFloat(value: string): number | undefined {
  const cleaned = value.trim().replace(/['\s]/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/** Signed integer, for `floor`: ground floor is 0, basements are negative. */
function signedInt(value: string): number | undefined {
  const cleaned = value.trim().replace(/['\s]/g, '');
  if (!/^-?\d+$/.test(cleaned)) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Four-digit year. XML 2.7.0 restricts years to the pattern [12][0-9]{3}, so a
 * value outside 1000-2999 is dropped rather than shipped in an XSD-invalid file.
 */
function year(value: string): number | undefined {
  const parsed = positiveInt(value);
  return parsed !== undefined && parsed >= 1000 && parsed <= 2999 ? parsed : undefined;
}

const DAY_MONTH_YEAR = /^(\d{2})\.(\d{2})\.(\d{4})$/;

/** IDX availability date (DD.MM.YYYY) to an ISO instant at midnight UTC. */
function isoStartDate(value: string): string | undefined {
  const match = DAY_MONTH_YEAR.exec(value.trim());
  if (!match) return undefined;
  const [, day, month, yyyy] = match;
  if (Number(month) < 1 || Number(month) > 12) return undefined;
  if (Number(day) < 1 || Number(day) > 31) return undefined;
  return `${yyyy}-${month}-${day}T00:00:00Z`;
}

/** Lowercase two-letter language code; falls back to 'de' for an odd locale. */
function languageCode(locale: string): string {
  const two = locale.trim().slice(0, 2).toLowerCase();
  return /^[a-z]{2}$/.test(two) ? two : 'de';
}

/** Rent interval per SwissRETS priceIntervalType; unset defaults to month. */
function rentInterval(unit: PriceUnit | ''): 'day' | 'week' | 'month' | 'year' {
  switch (unit) {
    case 'DAILY':
      return 'day';
    case 'WEEKLY':
      return 'week';
    case 'YEARLY':
    case 'M2YEARLY':
      return 'year';
    default:
      return 'month';
  }
}

/**
 * Applies a categoryMap characteristic hint. The generated map stores these as
 * "<name> = <value>" (for example "isUnderRoof = does-not-apply"), because a
 * few IDX object types map to a characteristic rather than to a category; a
 * bare name without a value means 'applies'.
 */
function applyMappedCharacteristic(
  target: Record<string, unknown>,
  spec: string | null,
): void {
  if (!spec) return;
  const separator = spec.indexOf('=');
  const name = (separator === -1 ? spec : spec.slice(0, separator)).trim();
  const rawValue = separator === -1 ? '' : spec.slice(separator + 1).trim();
  const value = rawValue || 'applies';
  if (!name || !APPLICABLE_VALUES.has(value)) return;
  target[name] = value;
}

function buildCharacteristics(
  draft: ListingDraft,
  mappedCharacteristic: string | null,
): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {};
  const put = (key: string, value: unknown) => {
    if (value !== undefined) out[key] = value;
  };
  const f = draft.features;

  // Tri-state amenities. Names verified against propertyCharacteristicsType.
  put('hasNiceView', applicable(f.view));
  put('hasFireplace', applicable(f.fireplace));
  put('hasCableTv', applicable(f.cabletv));
  put('hasElevator', applicable(f.elevator));
  put('isChildFriendly', applicable(f.childFriendly));
  put('hasParking', applicable(f.parking));
  put('hasGarage', applicable(f.garage));
  put('hasBalcony', applicable(f.balcony));
  put('isWheelchairAccessible', applicable(f.wheelchair));
  put('arePetsAllowed', applicable(f.animalAllowed));
  put('isNewConstruction', applicable(f.newBuilding));
  put('isOldBuilding', applicable(f.oldBuilding));
  put('hasSwimmingPool', applicable(f.swimmingpool));

  // Numerics.
  put('numberOfRooms', positiveFloat(draft.rooms));
  put('floor', signedInt(draft.floor));
  put('numberOfFloors', positiveInt(draft.numberOfFloors));
  put('numberOfApartements', positiveInt(draft.apartments));
  put('areaBwf', positiveInt(draft.surfaceLiving));
  put('areaPropertyLand', positiveInt(draft.surfaceProperty));
  put('volumeGva', positiveInt(draft.volume));
  put('yearBuilt', year(draft.yearBuilt));
  put('yearLastRenovated', year(draft.yearRenovated));

  applyMappedCharacteristic(out, mappedCharacteristic);

  return Object.keys(out).length > 0 ? out : undefined;
}

function buildAddress(draft: ListingDraft): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {};
  const country = draft.country.trim();
  if (/^[A-Za-z]{2}$/.test(country)) out.countryCode = country.toUpperCase();

  const locality = text(draft.city);
  if (locality) out.locality = locality;
  const postalCode = text(draft.zip);
  if (postalCode) out.postalCode = postalCode;
  // The IDX street field carries house number and addition inline; SwissRETS
  // splits them, but guessing the split corrupts addresses far more often than
  // it helps, so the full string stays in `street`.
  const street = text(draft.street);
  if (street) out.street = street;
  const region = text(draft.canton);
  if (region) out.region = region.toUpperCase();

  if (
    draft.lat != null &&
    draft.lng != null &&
    Number.isFinite(draft.lat) &&
    Number.isFinite(draft.lng)
  ) {
    out.geo = { latitude: draft.lat, longitude: draft.lng };
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

function buildLocalization(draft: ListingDraft, opts: SwissRetsBuildOptions) {
  // `title` and `languageCode` are the two required members of localizationType.
  const out: Record<string, unknown> = {
    languageCode: languageCode(opts.locale),
    title: draft.title.trim(),
  };

  const description = text(draft.description);
  if (description) out.description = description;
  const location = text(draft.situation);
  if (location) out.location = location;

  const images = draft.images
    .filter((image) => Boolean(text(image.publicUrl)))
    .map((image) => {
      const entry: Record<string, unknown> = { url: image.publicUrl.trim() };
      const title = text(image.title);
      if (title) entry.title = title;
      return entry;
    });
  if (images.length > 0) out.attachments = { images };

  return out;
}

function buildPrices(draft: ListingDraft): Record<string, unknown> | undefined {
  const currency = draft.currency.trim();
  const out: Record<string, unknown> = {};
  if (/^[A-Za-z]{3}$/.test(currency)) out.currency = currency.toUpperCase();

  if (draft.offerType === 'SALE') {
    const price = positiveInt(draft.sellingPrice);
    if (price === undefined) return undefined;
    const buy: Record<string, unknown> = { price };
    if (draft.priceUnit === 'SELLM2') buy.referring = 'm2';
    out.buy = buy;
    return out;
  }

  const net = positiveInt(draft.rentNet);
  if (net === undefined) return undefined;
  const extra = positiveInt(draft.rentExtra);
  const rent: Record<string, unknown> = { net };
  if (extra !== undefined) rent.extra = extra;
  rent.gross = net + (extra ?? 0);
  rent.interval = rentInterval(draft.priceUnit);
  if (draft.priceUnit === 'M2YEARLY') rent.referring = 'm2';
  out.rent = rent;
  return out;
}

/**
 * Builds a one-property SwissRETS inventory from the publish draft. The result
 * is schema-valid JSON 3.6.0; `serializeSwissRetsXml` narrows the same object
 * down to what XML 2.7.0 accepts.
 */
export function buildSwissRetsInventory(
  draft: ListingDraft,
  opts: SwissRetsBuildOptions,
): Record<string, unknown> {
  const reference = draft.refProperty.trim();
  // `id` and `referenceId` are both required; a blank form field still has to
  // produce a stable, unique-looking key.
  const id = reference || 'listing-1';

  const property: Record<string, unknown> = {
    id,
    referenceId: id,
    type: draft.offerType === 'SALE' ? 'buy' : 'rent',
  };

  // JSON-only escape hatch that keeps the IDX reference round-trippable.
  if (reference) property.externalReference = { refProperty: reference };

  const availability: Record<string, unknown> = { state: 'active' };
  const start = isoStartDate(draft.availableFrom);
  if (start) availability.start = start;
  property.availability = availability;

  const address = buildAddress(draft);
  if (address) property.address = address;

  const mapping = swissRetsCategoriesFor(draft.category, draft.objectType);
  if (mapping.categories.length > 0) property.categories = [...mapping.categories];

  const characteristics = buildCharacteristics(draft, mapping.characteristic);
  if (characteristics) property.characteristics = characteristics;

  // Only the certified flag has a SwissRETS slot; `minergieGeneral` (Minergie
  // "in the style of", uncertified) has no enum value and is intentionally lost.
  if (draft.features.minergieCertified === 'Y') property.minergieCertification = 'Minergie';

  const prices = buildPrices(draft);
  if (prices) property.prices = prices;

  property.localizations = [buildLocalization(draft, opts)];

  return {
    created: opts.now.toISOString(),
    generator: { name: 'Aireon Showroom', version: opts.generatorVersion },
    properties: [property],
  };
}
