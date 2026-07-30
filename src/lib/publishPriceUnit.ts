// Price-unit defaults and validity for the publish form. Lives outside
// src/lib/idx/ on purpose: the IDX engine (types.ts, validate.ts) stays
// frozen, so this is the UI-facing companion that keeps `priceUnit` from
// ever landing on the draft as ''.
import type { OfferType, PriceUnit } from './idx/types';

/** Price units the spec allows per offer type. Mirrors the pairs in
 *  src/lib/idx/validate.ts (SALE_PRICE_UNITS / RENT_PRICE_UNITS) — kept in
 *  sync by hand since that file is not to be touched. */
export const SALE_PRICE_UNITS: PriceUnit[] = ['SELL', 'SELLM2'];
export const RENT_PRICE_UNITS: PriceUnit[] = ['MONTHLY', 'WEEKLY', 'DAILY', 'YEARLY', 'M2YEARLY'];

export function priceUnitsFor(offerType: OfferType): PriceUnit[] {
  return offerType === 'SALE' ? SALE_PRICE_UNITS : RENT_PRICE_UNITS;
}

/** No price unit is valid for both offer types, so there is never a "keep
 *  the current one" case: a switch — or a legacy draft whose unit does not
 *  match its offer type — always lands on this default. */
export function defaultPriceUnit(offerType: OfferType): PriceUnit {
  return offerType === 'SALE' ? 'SELL' : 'MONTHLY';
}

export function isValidPriceUnit(unit: PriceUnit | '', offerType: OfferType): unit is PriceUnit {
  return unit !== '' && (priceUnitsFor(offerType) as string[]).includes(unit);
}

/** Normalizes a draft's priceUnit in place: empty or invalid-for-offerType
 *  (a pre-default-unit build's persisted draft, or an offer-type switch)
 *  becomes the default for the current offer type. A valid unit is left
 *  untouched. */
export function normalizedPriceUnit(unit: PriceUnit | '', offerType: OfferType): PriceUnit {
  return isValidPriceUnit(unit, offerType) ? unit : defaultPriceUnit(offerType);
}
