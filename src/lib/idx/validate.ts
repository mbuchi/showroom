// Draft validation against the IDX 3.01 must-field matrix.
// See docs/plans/2026-07-29-portal-publisher.md.
import type { IdxIssue, ListingDraft, PriceUnit } from './types';

const RENT_PRICE_UNITS: PriceUnit[] = ['YEARLY', 'M2YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY'];
const SALE_PRICE_UNITS: PriceUnit[] = ['SELL', 'SELLM2'];

const CH_ZIP_RE = /^\d{4}$/;
const COUNTRY_RE = /^[A-Za-z]{2}$/;
const DATE_RE = /^\d{2}\.\d{2}\.\d{4}$/;
const YEAR_RE = /^\d{4}$/;

function error(field: string, messageKey: string, params?: Record<string, string | number>): IdxIssue {
  return { severity: 'error', field, messageKey, params };
}

function warning(field: string, messageKey: string, params?: Record<string, string | number>): IdxIssue {
  return { severity: 'warning', field, messageKey, params };
}

export function validateDraft(draft: ListingDraft): IdxIssue[] {
  const issues: IdxIssue[] = [];

  if (!draft.refProperty.trim()) {
    issues.push(error('refProperty', 'issue.refRequired'));
  }
  if (draft.country.toUpperCase() === 'CH' && !CH_ZIP_RE.test(draft.zip)) {
    issues.push(error('zip', 'issue.zipInvalid'));
  }
  if (!draft.city.trim()) {
    issues.push(error('city', 'issue.cityRequired'));
  }
  if (!COUNTRY_RE.test(draft.country)) {
    issues.push(error('country', 'issue.countryInvalid'));
  }
  if (!draft.title.trim()) {
    issues.push(error('title', 'issue.titleRequired'));
  }
  if (!draft.description.trim()) {
    issues.push(error('description', 'issue.descriptionRequired'));
  }
  if (draft.objectType == null) {
    issues.push(error('objectType', 'issue.typeRequired'));
  }
  if (draft.priceUnit) {
    const allowed = draft.offerType === 'RENT' ? RENT_PRICE_UNITS : SALE_PRICE_UNITS;
    if (!(allowed as string[]).includes(draft.priceUnit)) {
      issues.push(error('priceUnit', 'issue.priceUnitMismatch'));
    }
  }
  if (draft.availableFrom && !DATE_RE.test(draft.availableFrom)) {
    issues.push(error('availableFrom', 'issue.dateInvalid'));
  }
  if (draft.yearBuilt && !YEAR_RE.test(draft.yearBuilt)) {
    issues.push(error('yearBuilt', 'issue.yearInvalid', { field: 'yearBuilt' }));
  }
  if (draft.yearRenovated && !YEAR_RE.test(draft.yearRenovated)) {
    issues.push(error('yearRenovated', 'issue.yearInvalid', { field: 'yearRenovated' }));
  }

  if (!draft.agencyId.trim()) {
    issues.push(warning('agencyId', 'issue.agencyIdMissing'));
  }
  const price = draft.offerType === 'SALE' ? draft.sellingPrice : draft.rentNet;
  if (!price.trim()) {
    issues.push(warning(draft.offerType === 'SALE' ? 'sellingPrice' : 'rentNet', 'issue.priceOnRequest'));
  }
  if (!draft.street.trim()) {
    issues.push(warning('street', 'issue.noStreet'));
  }
  if (draft.images.length === 0) {
    issues.push(warning('images', 'issue.noImages'));
  }
  if (draft.title.length > 70) {
    issues.push(warning('title', 'issue.titleTruncated', { max: 70 }));
  }
  if (draft.description.length > 4000) {
    issues.push(warning('description', 'issue.descriptionTruncated', { max: 4000 }));
  }
  if (!draft.priceUnit) {
    issues.push(warning('priceUnit', 'issue.priceUnitDefaulted'));
  }

  return issues;
}
