// IDX 3.01 record builder. See docs/plans/2026-07-29-portal-publisher.md.
import type { ListingDraft } from './types';

export const IDX_FIELD_COUNT = 183;
export const IDX_MAX_PICTURES = 13;

export interface BuildRecordOptions {
  senderId: string;
  lastModified: Date;
}

const ALLOWED_TAG_NAMES = new Set(['br', 'b', 'li']);

/** Strips every HTML tag except <br>, <b>, </b>, <li>, </li> (case-insensitive), normalizing survivors to lowercase. */
function stripDisallowedTags(input: string): string {
  return input.replace(/<[^>]*>/g, (tag) => {
    const match = /^<\s*(\/)?\s*([a-zA-Z]+)\s*(\/)?\s*>$/.exec(tag);
    if (!match) return '';
    const isClosing = Boolean(match[1]);
    const name = match[2].toLowerCase();
    if (!ALLOWED_TAG_NAMES.has(name)) return '';
    return isClosing ? `</${name}>` : `<${name}>`;
  });
}

export function sanitizeIdxText(input: string, maxLen: number): string {
  let s = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  s = s.replace(/\n/g, '<br>');
  s = stripDisallowedTags(s);
  s = s.replace(/#/g, '');
  s = s.replace(/\s+/g, ' ');
  s = s.trim();
  return s.slice(0, maxLen);
}

export function digitsOnly(input: string): string {
  return input.replace(/\D+/g, '');
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatIdxDate(d: Date): string {
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function formatIdxDateTime(d: Date): string {
  return `${formatIdxDate(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export function serializeUnload(rows: string[][]): string {
  return rows.map((row) => `${row.join('#')}#\r\n`).join('');
}

/** Gross rent = net + extra when net is present; numeric add on digit-cleaned values. */
function rentGross(draft: ListingDraft): string {
  const net = digitsOnly(draft.rentNet);
  if (!net) return '';
  const extra = digitsOnly(draft.rentExtra) || '0';
  return String(Number(net) + Number(extra));
}

function imageFilename(draft: ListingDraft, index: number): string {
  return draft.images[index]?.filename ?? '';
}

function imageTitle(draft: ListingDraft, index: number): string {
  return sanitizeIdxText(draft.images[index]?.title ?? '', 200);
}

export function buildIdxFields(draft: ListingDraft, opts: BuildRecordOptions): string[] {
  const f = new Array<string>(IDX_FIELD_COUNT).fill('');

  f[0] = 'IDX3.01';
  f[1] = opts.senderId;
  f[2] = draft.category;
  f[3] = draft.objectType == null ? '' : String(draft.objectType);
  f[4] = draft.offerType;
  f[5] = sanitizeIdxText(draft.refProperty, 80);
  // 6, 7: ref_house / ref_object - unused, refProperty carries the unique key
  f[8] = sanitizeIdxText(draft.street, 200);
  f[9] = sanitizeIdxText(draft.zip, 10);
  f[10] = sanitizeIdxText(draft.city, 200);
  f[11] = draft.canton.toUpperCase();
  f[12] = draft.country.toUpperCase();
  // 13: unused
  f[14] = sanitizeIdxText(draft.situation, 50);
  f[15] = draft.availableFrom;
  f[16] = sanitizeIdxText(draft.title, 70);
  f[17] = sanitizeIdxText(draft.description, 4000);

  if (draft.offerType === 'SALE') {
    f[18] = digitsOnly(draft.sellingPrice);
    f[19] = '';
    f[20] = '';
  } else {
    f[18] = rentGross(draft);
    f[19] = digitsOnly(draft.rentNet);
    f[20] = digitsOnly(draft.rentExtra);
  }

  f[21] = draft.priceUnit;
  f[22] = draft.currency.toUpperCase();
  // 23: unused
  f[24] = draft.floor.trim();
  f[25] = draft.rooms.trim();
  f[26] = digitsOnly(draft.apartments);
  f[27] = digitsOnly(draft.surfaceLiving);
  f[28] = digitsOnly(draft.surfaceProperty);
  f[29] = digitsOnly(draft.surfaceUsable);
  f[30] = digitsOnly(draft.volume);
  f[31] = digitsOnly(draft.yearBuilt);

  f[32] = draft.features.view;
  f[33] = draft.features.fireplace;
  f[34] = draft.features.cabletv;
  f[35] = draft.features.elevator;
  f[36] = draft.features.childFriendly;
  f[37] = draft.features.parking;
  f[38] = draft.features.garage;
  f[39] = draft.features.balcony;
  // 40-45: unused

  for (let i = 0; i < 5; i++) {
    f[46 + i] = imageFilename(draft, i);
    f[51 + i] = imageTitle(draft, i);
  }
  // 56-63, 64-66: unused

  f[67] = sanitizeIdxText(draft.url, 200);
  f[68] = sanitizeIdxText(draft.agencyId, 10);
  f[69] = sanitizeIdxText(draft.agencyName, 200);
  // 70: unused
  f[71] = sanitizeIdxText(draft.agencyReference, 200);
  // 72-75: unused
  f[76] = sanitizeIdxText(draft.agencyPhone, 200);
  // 77, 78: unused
  f[79] = sanitizeIdxText(draft.agencyEmail, 200);
  // 80: unused
  f[81] = sanitizeIdxText(draft.visitName, 200);
  f[82] = sanitizeIdxText(draft.visitPhone, 200);
  // 83: unused
  f[84] = sanitizeIdxText(draft.visitRemark, 200);
  // 85, 86: unused

  for (let i = 0; i < 4; i++) {
    f[87 + i] = imageFilename(draft, 5 + i);
    f[91 + i] = imageTitle(draft, 5 + i);
  }
  // 95-113: unused
  // 114: isdn, unused

  f[115] = draft.features.wheelchair;
  f[116] = draft.features.animalAllowed;
  // 117-141: unused

  for (let i = 0; i < 4; i++) {
    f[142 + i] = imageFilename(draft, 9 + i);
    f[146 + i] = imageTitle(draft, 9 + i);
  }
  // 150-161: unused

  f[162] = digitsOnly(draft.numberOfFloors);
  f[163] = digitsOnly(draft.yearRenovated);
  // 164-169: unused

  f[170] = draft.features.newBuilding;
  f[171] = draft.features.oldBuilding;
  // 172, 173: unused
  f[174] = draft.features.swimmingpool;
  f[175] = draft.features.minergieGeneral;
  f[176] = draft.features.minergieCertified;
  f[177] = formatIdxDateTime(opts.lastModified);
  // 178-182: unused

  return f;
}
