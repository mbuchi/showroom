import { describe, expect, it } from 'vitest';
import { encodeLatin1, transliterate, sanitizeIdxFilename } from '../latin1';

describe('latin1', () => {
  it('keeps umlauts as single Latin-1 bytes', () => {
    const b = encodeLatin1('Zürich');
    expect(Array.from(b)).toEqual([0x5a, 0xfc, 0x72, 0x69, 0x63, 0x68]);
  });
  it('transliterates outside-Latin-1 punctuation', () => {
    expect(transliterate('“quote” – dash… €')).toBe('"quote" - dash... EUR');
  });
  it('unmappable chars become ?', () => {
    expect(Array.from(encodeLatin1('日'))).toEqual([0x3f]);
  });
  it('sanitizeIdxFilename enforces portal filename rules', () => {
    expect(sanitizeIdxFilename('Küchen Bild (1).png')).toBe('kuechen_bild_1.jpg');
    expect(sanitizeIdxFilename('already.jpg')).toBe('already.jpg');
  });
});
