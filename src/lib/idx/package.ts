// ZIP packaging of the IDX export (data/unload.txt + images/ + README.txt).
import { strToU8, zipSync } from 'fflate';
import type { ListingDraft, PreparedImage } from './types';
import type { BuildRecordOptions } from './record';
import { buildIdxFields, serializeUnload } from './record';
import { encodeLatin1 } from './latin1';

export function buildUnloadBytes(draft: ListingDraft, opts: BuildRecordOptions): Uint8Array {
  const fields = buildIdxFields(draft, opts);
  const text = serializeUnload([fields]);
  return encodeLatin1(text);
}

export function buildIdxPackage(args: {
  unload: Uint8Array;
  images: PreparedImage[];
  readme: string;
  /** Extra ZIP entries keyed by path, e.g. the swissrets/ pair. Optional so
   *  every existing caller keeps working unchanged. */
  extraFiles?: Record<string, Uint8Array>;
}): Blob {
  const files: Record<string, Uint8Array> = {
    'data/unload.txt': args.unload,
    'README.txt': strToU8(args.readme),
  };
  for (const image of args.images) {
    files[`images/${image.filename}`] = image.data;
  }
  for (const [path, data] of Object.entries(args.extraFiles ?? {})) {
    files[path] = data;
  }
  const zipped = zipSync(files);
  return new Blob([zipped], { type: 'application/zip' });
}
