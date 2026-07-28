import { describe, expect, it } from 'vitest';
import { buildIdxFields, serializeUnload, sanitizeIdxText, digitsOnly, formatIdxDateTime, IDX_FIELD_COUNT } from '../record';
import { emptyListingDraft } from '../types';
import { buildUnloadBytes } from '../package';

const OPTS = { senderId: 'Aireon Showroom v0.21.0', lastModified: new Date(2026, 6, 29, 13, 42, 37) };

function draft() {
  const d = emptyListingDraft();
  d.refProperty = 'CH123456789012';
  d.zip = '8001'; d.city = 'Zurich'; d.canton = 'zh';
  d.title = 'Nice flat'; d.description = 'Line1\nLine2';
  d.offerType = 'RENT'; d.rentNet = "2'500"; d.rentExtra = '250';
  return d;
}

describe('buildIdxFields', () => {
  it('always returns exactly 183 fields', () => {
    expect(buildIdxFields(draft(), OPTS)).toHaveLength(IDX_FIELD_COUNT);
  });
  it('places core fields at spec positions', () => {
    const f = buildIdxFields(draft(), OPTS);
    expect(f[0]).toBe('IDX3.01');
    expect(f[2]).toBe('APPT');
    expect(f[4]).toBe('RENT');
    expect(f[9]).toBe('8001');
    expect(f[11]).toBe('ZH');
    expect(f[16]).toBe('Nice flat');
    expect(f[177]).toBe('29.07.2026 13:42:37');
  });
  it('RENT: field 18 is gross (net+extra), 19 net, 20 extra, digit-cleaned', () => {
    const f = buildIdxFields(draft(), OPTS);
    expect(f[19]).toBe('2500');
    expect(f[20]).toBe('250');
    expect(f[18]).toBe('2750');
  });
  it('SALE: field 18 selling price, 19/20 empty', () => {
    const d = draft(); d.offerType = 'SALE'; d.sellingPrice = '1200000';
    const f = buildIdxFields(d, OPTS);
    expect(f[18]).toBe('1200000');
    expect(f[19]).toBe('');
    expect(f[20]).toBe('');
  });
  it('maps up to 13 picture filenames to slots 46-50, 87-90, 142-145', () => {
    const d = draft();
    d.images = Array.from({ length: 13 }, (_, i) => ({ savedImageId: i, publicUrl: '', filename: `p${i + 1}.jpg`, title: `T${i + 1}` }));
    const f = buildIdxFields(d, OPTS);
    expect(f[46]).toBe('p1.jpg'); expect(f[50]).toBe('p5.jpg');
    expect(f[87]).toBe('p6.jpg'); expect(f[90]).toBe('p9.jpg');
    expect(f[142]).toBe('p10.jpg'); expect(f[145]).toBe('p13.jpg');
    expect(f[51]).toBe('T1'); expect(f[146]).toBe('T10');
  });
});

describe('serializeUnload', () => {
  it('joins with #, trailing #, CRLF per record', () => {
    const out = serializeUnload([['a', 'b'], ['c', 'd']]);
    expect(out).toBe('a#b#\r\nc#d#\r\n');
  });
});

describe('sanitizeIdxText', () => {
  it('strips #, keeps <br>/<b>, drops other tags, truncates', () => {
    expect(sanitizeIdxText('a#b', 10)).toBe('ab');
    expect(sanitizeIdxText('x\ny', 10)).toBe('x<br>y');
    expect(sanitizeIdxText('<i>hi</i> <b>bold</b>', 50)).toBe('hi <b>bold</b>');
    expect(sanitizeIdxText('abcdef', 3)).toBe('abc');
  });
});

describe('digitsOnly', () => {
  it('strips everything but digits', () => {
    expect(digitsOnly("1'200’000 CHF")).toBe('1200000');
    expect(digitsOnly('')).toBe('');
  });
});

describe('formatIdxDateTime', () => {
  it('formats DD.MM.YYYY HH:mm:ss in 24h', () => {
    expect(formatIdxDateTime(new Date(2026, 6, 29, 13, 42, 37))).toBe('29.07.2026 13:42:37');
  });
});

describe('buildUnloadBytes round-trip', () => {
  it('produces a Latin-1 unload with exactly 183 # separators per record', () => {
    const bytes = buildUnloadBytes(draft(), OPTS);
    const text = Array.from(bytes).map((b) => String.fromCharCode(b)).join('');
    expect(text.endsWith('#\r\n')).toBe(true);
    expect(text.split('#').length - 1).toBe(IDX_FIELD_COUNT);
  });
});
