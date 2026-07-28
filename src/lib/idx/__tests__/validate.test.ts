import { describe, expect, it } from 'vitest';
import { validateDraft } from '../validate';
import { emptyListingDraft } from '../types';
import type { IdxIssue, ListingDraft } from '../types';

function validDraft(): ListingDraft {
  const d = emptyListingDraft();
  d.refProperty = 'REF001';
  d.street = 'Bahnhofstrasse 1';
  d.zip = '8001';
  d.city = 'Zurich';
  d.canton = 'ZH';
  d.country = 'CH';
  d.title = 'A nice flat';
  d.description = 'A long enough description.';
  d.objectType = 1;
  d.offerType = 'SALE';
  d.sellingPrice = '1000000';
  d.priceUnit = 'SELL';
  d.agencyId = 'AG1';
  d.images = [{ savedImageId: 1, publicUrl: '', filename: 'p1.jpg', title: 'Living room' }];
  return d;
}

function issues(d: ListingDraft, severity: IdxIssue['severity']): IdxIssue[] {
  return validateDraft(d).filter((i) => i.severity === severity);
}

describe('validateDraft', () => {
  it('returns no errors and no warnings for a fully valid draft', () => {
    expect(validateDraft(validDraft())).toEqual([]);
  });

  it('flags a blank refProperty', () => {
    const d = validDraft(); d.refProperty = '';
    expect(issues(d, 'error').map((i) => i.messageKey)).toContain('issue.refRequired');
  });

  it('flags a CH zip that is not 4 digits', () => {
    const d = validDraft(); d.zip = '80';
    expect(issues(d, 'error').map((i) => i.messageKey)).toContain('issue.zipInvalid');
  });

  it('flags a blank city', () => {
    const d = validDraft(); d.city = '';
    expect(issues(d, 'error').map((i) => i.messageKey)).toContain('issue.cityRequired');
  });

  it('flags a country that is not 2 letters', () => {
    const d = validDraft(); d.country = 'Switzerland';
    expect(issues(d, 'error').map((i) => i.messageKey)).toContain('issue.countryInvalid');
  });

  it('flags a blank title', () => {
    const d = validDraft(); d.title = '';
    expect(issues(d, 'error').map((i) => i.messageKey)).toContain('issue.titleRequired');
  });

  it('flags a blank description', () => {
    const d = validDraft(); d.description = '';
    expect(issues(d, 'error').map((i) => i.messageKey)).toContain('issue.descriptionRequired');
  });

  it('flags a null objectType', () => {
    const d = validDraft(); d.objectType = null;
    expect(issues(d, 'error').map((i) => i.messageKey)).toContain('issue.typeRequired');
  });

  it('flags a RENT draft with a SALE-only priceUnit', () => {
    const d = validDraft(); d.offerType = 'RENT'; d.rentNet = '2000'; d.priceUnit = 'SELL';
    expect(issues(d, 'error').map((i) => i.messageKey)).toContain('issue.priceUnitMismatch');
  });

  it('flags a malformed availableFrom date', () => {
    const d = validDraft(); d.availableFrom = '2027-01-01';
    expect(issues(d, 'error').map((i) => i.messageKey)).toContain('issue.dateInvalid');
  });

  it('flags a yearBuilt that is not 4 digits, with the field param', () => {
    const d = validDraft(); d.yearBuilt = '99';
    const err = issues(d, 'error').find((i) => i.messageKey === 'issue.yearInvalid' && i.params?.field === 'yearBuilt');
    expect(err).toBeTruthy();
  });

  it('flags a yearRenovated that is not 4 digits, with the field param', () => {
    const d = validDraft(); d.yearRenovated = '99';
    const err = issues(d, 'error').find((i) => i.messageKey === 'issue.yearInvalid' && i.params?.field === 'yearRenovated');
    expect(err).toBeTruthy();
  });

  it('warns when agencyId is blank', () => {
    const d = validDraft(); d.agencyId = '';
    expect(issues(d, 'warning').map((i) => i.messageKey)).toContain('issue.agencyIdMissing');
  });

  it('warns when the offer has no price (SALE)', () => {
    const d = validDraft(); d.sellingPrice = '';
    expect(issues(d, 'warning').map((i) => i.messageKey)).toContain('issue.priceOnRequest');
  });

  it('warns when the offer has no price (RENT)', () => {
    const d = validDraft(); d.offerType = 'RENT'; d.priceUnit = 'MONTHLY'; d.rentNet = '';
    expect(issues(d, 'warning').map((i) => i.messageKey)).toContain('issue.priceOnRequest');
  });

  it('warns when street is blank', () => {
    const d = validDraft(); d.street = '';
    expect(issues(d, 'warning').map((i) => i.messageKey)).toContain('issue.noStreet');
  });

  it('warns when there are no images', () => {
    const d = validDraft(); d.images = [];
    expect(issues(d, 'warning').map((i) => i.messageKey)).toContain('issue.noImages');
  });

  it('warns when title is longer than 70 chars, with the max param', () => {
    const d = validDraft(); d.title = 'A'.repeat(80);
    const w = issues(d, 'warning').find((i) => i.messageKey === 'issue.titleTruncated');
    expect(w?.params?.max).toBe(70);
  });

  it('warns when description is longer than 4000 chars, with the max param', () => {
    const d = validDraft(); d.description = 'A'.repeat(4001);
    const w = issues(d, 'warning').find((i) => i.messageKey === 'issue.descriptionTruncated');
    expect(w?.params?.max).toBe(4000);
  });

  it('warns when priceUnit is left empty', () => {
    const d = validDraft(); d.priceUnit = '';
    expect(issues(d, 'warning').map((i) => i.messageKey)).toContain('issue.priceUnitDefaulted');
  });
});
