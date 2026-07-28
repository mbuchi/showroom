// ZIP packaging of the IDX export (data/unload.txt + images/ + README.txt).
// STUB: the engine task replaces the bodies.
import type { ListingDraft, PreparedImage } from './types';
import type { BuildRecordOptions } from './record';

export function buildUnloadBytes(draft: ListingDraft, opts: BuildRecordOptions): Uint8Array {
  void draft;
  void opts;
  return new Uint8Array(0);
}

export function buildIdxPackage(args: {
  unload: Uint8Array;
  images: PreparedImage[];
  readme: string;
}): Blob {
  void args;
  return new Blob([]);
}
