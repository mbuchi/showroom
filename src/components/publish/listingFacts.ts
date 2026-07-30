// Facts the "magic fill" button hands to the copywriter model.
//
// Keys are English labels even when the copy is generated in another language:
// the system prompt is English, and the model is asked to write in the UI
// locale. Values that carry portal wording (category, object type) use the
// current locale, because those phrases belong in the finished listing.
//
// Price is deliberately absent. The prompt forbids naming a price, and the
// surest way to keep one out of the copy is to never send it.

import { OBJECT_CATEGORY_LABELS, objectTypeLabel } from '../../lib/idx/codes';
import type { ListingDraft, ListingFeatures, ObjectCategory } from '../../lib/idx/types';

/** Readable names for the IDX feature flags, in the order the form shows them. */
const FEATURE_LABELS: Record<keyof ListingFeatures, string> = {
  view: 'view',
  fireplace: 'fireplace',
  cabletv: 'cable TV',
  elevator: 'elevator',
  childFriendly: 'child friendly',
  parking: 'parking space',
  garage: 'garage',
  balcony: 'balcony',
  wheelchair: 'wheelchair access',
  animalAllowed: 'pets allowed',
  newBuilding: 'new building',
  oldBuilding: 'old building',
  swimmingpool: 'swimming pool',
  minergieGeneral: 'Minergie construction',
  minergieCertified: 'Minergie certified',
};

/** Portal category wording in the active locale, English outside the four. */
export function categoryLabel(category: ObjectCategory, locale: string): string {
  const labels = OBJECT_CATEGORY_LABELS[category];
  if (locale === 'de' || locale === 'fr' || locale === 'it') return labels[locale];
  return labels.en;
}

/** Parcel facts from the last prefill that inform the copy but live in no
 *  IDX field of their own. */
export interface ListingFactContext {
  zone: string | null;
  buildingCount: number | null;
}

/**
 * The draft has enough grounded substance to write from: something that
 * identifies the property (a city or a reference) plus a known object type.
 * Below that the model would be padding, which is exactly what the grounding
 * rules forbid.
 */
export function hasEnoughFacts(draft: ListingDraft): boolean {
  const identified = draft.city.trim() !== '' || draft.refProperty.trim() !== '';
  return identified && draft.objectType != null;
}

/**
 * Flatten a draft into the "label: value" facts the model may use. Empty
 * values are kept out here and dropped again at serialization time, so a
 * half-filled draft yields a short brief instead of a list of blanks.
 */
export function buildListingFacts(
  draft: ListingDraft,
  context: ListingFactContext,
  locale: string,
): Record<string, string | number> {
  const facts: Record<string, string | number> = {};

  const put = (key: string, value: string | number | null | undefined) => {
    if (value === null || value === undefined) return;
    const text = typeof value === 'number' ? String(value) : value.trim();
    if (text === '') return;
    facts[key] = text;
  };

  put('Offer type', draft.offerType === 'SALE' ? 'for sale' : 'for rent');
  put('Property category', categoryLabel(draft.category, locale));
  if (draft.objectType != null) {
    put('Object type', objectTypeLabel(draft.category, draft.objectType, locale));
  }

  put('Rooms', draft.rooms);
  put('Living space (m2)', draft.surfaceLiving);
  put('Plot area (m2)', draft.surfaceProperty);
  put('Volume (m3)', draft.volume);
  put('Year built', draft.yearBuilt);
  put('Year renovated', draft.yearRenovated);
  put('Floors in building', draft.numberOfFloors);
  put('Floor of the unit', draft.floor);

  // Locality only. The street never travels: the prompt bans addresses, and a
  // fact the model never sees cannot leak into the copy.
  put('Postal code', draft.zip);
  put('City', draft.city);
  put('Canton', draft.canton);
  put('Situation', draft.situation);

  const features = (Object.keys(FEATURE_LABELS) as (keyof ListingFeatures)[])
    .filter((key) => draft.features[key] === 'Y')
    .map((key) => FEATURE_LABELS[key]);
  if (features.length > 0) put('Features', features.join(', '));

  put('Zoning', context.zone);
  put('Buildings on the parcel', context.buildingCount);

  return facts;
}
