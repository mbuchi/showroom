// Latin-1 (ISO-8859-1) encoding helpers for IDX 3.01 output.

/** Codepoints above 0xFF that have a sensible Latin-1-safe replacement. */
const TRANSLITERATION_MAP: Record<string, string> = {
  '‘': "'", // ' left single quote
  '’': "'", // ' right single quote
  '‚': "'", // , single low-9 quote
  '‛': "'", // single high-reversed-9 quote
  '“': '"', // " left double quote
  '”': '"', // " right double quote
  '„': '"', // „ double low-9 quote
  '‟': '"', // double high-reversed-9 quote
  '–': '-', // en dash
  '—': '-', // em dash
  '…': '...', // ellipsis
  '€': 'EUR', // euro sign
  ' ': ' ', // non-breaking space
  'Œ': 'OE', // Œ
  'œ': 'oe', // œ
  'Š': 'S', // Š
  'š': 's', // š
  'Ž': 'Z', // Ž
  'ž': 'z', // ž
};

/** Maps outside-Latin-1 codepoints to Latin-1 equivalents; unmapped ones become '?'. */
export function transliterate(text: string): string {
  let out = '';
  for (const ch of text) {
    const mapped = TRANSLITERATION_MAP[ch];
    if (mapped !== undefined) {
      out += mapped;
      continue;
    }
    const code = ch.codePointAt(0) ?? 0;
    out += code <= 0xff ? ch : '?';
  }
  return out;
}

export function encodeLatin1(text: string): Uint8Array {
  const t = transliterate(text);
  const out = new Uint8Array(t.length);
  for (let i = 0; i < t.length; i++) out[i] = t.charCodeAt(i) & 0xff;
  return out;
}

/** Portal filename forbidden set, plus commas: ( ) # ; ! $ ^ " @ * + / \ & , */
const FORBIDDEN_FILENAME_CHARS = /[(),;!$^"@*+/\\&#]/g;

export function sanitizeIdxFilename(name: string): string {
  let s = name.toLowerCase();
  s = s.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/\s+/g, '_');
  s = s.replace(FORBIDDEN_FILENAME_CHARS, '');
  s = s.replace(/[^a-z0-9._-]/g, '');
  s = s.replace(/_+/g, '_');

  const lastDot = s.lastIndexOf('.');
  const base = lastDot > 0 ? s.slice(0, lastDot) : s;
  return `${base}.jpg`;
}
