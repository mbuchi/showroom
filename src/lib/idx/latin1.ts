// Latin-1 (ISO-8859-1) encoding helpers for IDX 3.01 output. STUB: signatures
// are the contract; the engine task replaces the bodies.

export function transliterate(text: string): string {
  return text;
}

export function encodeLatin1(text: string): Uint8Array {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) out[i] = text.charCodeAt(i) & 0xff;
  return out;
}

export function sanitizeIdxFilename(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9._-]+/g, '_');
  return base.endsWith('.jpg') ? base : `${base}.jpg`;
}
