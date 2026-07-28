// IDX 3.01 record builder. STUB: signatures are the contract; the engine task
// replaces the bodies. See docs/plans/2026-07-29-portal-publisher.md.
import type { ListingDraft } from './types';

export const IDX_FIELD_COUNT = 183;
export const IDX_MAX_PICTURES = 13;

export interface BuildRecordOptions {
  senderId: string;
  lastModified: Date;
}

export function buildIdxFields(draft: ListingDraft, opts: BuildRecordOptions): string[] {
  void draft;
  void opts;
  return new Array<string>(IDX_FIELD_COUNT).fill('');
}

export function serializeUnload(rows: string[][]): string {
  return rows.map((row) => `${row.join('#')}#\r\n`).join('');
}

export function sanitizeIdxText(input: string, maxLen: number): string {
  return input.slice(0, maxLen);
}

export function digitsOnly(input: string): string {
  return input.replace(/\D+/g, '');
}

export function formatIdxDate(d: Date): string {
  void d;
  return '';
}

export function formatIdxDateTime(d: Date): string {
  void d;
  return '';
}
