import { describe, expect, it } from 'vitest';
import { strFromU8, unzipSync } from 'fflate';
import { buildIdxPackage } from '../package';
import type { PreparedImage } from '../types';

const UNLOAD = new TextEncoder().encode('IDX3.01#Aireon#\r\n');
const IMAGES: PreparedImage[] = [
  { filename: 'a1.jpg', data: new Uint8Array([0xff, 0xd8, 0xff]) },
  { filename: 'a2.jpg', data: new Uint8Array([0xff, 0xd8, 0xfe]) },
];

/** fflate's zipSync output is read back so the assertions are on the real ZIP.
 *  jsdom's Blob has no arrayBuffer(), hence the FileReader round trip. */
function entriesOf(blob: Blob): Promise<Record<string, Uint8Array>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(unzipSync(new Uint8Array(reader.result as ArrayBuffer)));
    reader.readAsArrayBuffer(blob);
  });
}

describe('buildIdxPackage', () => {
  it('writes the IDX layout when no extra files are given', async () => {
    const files = await entriesOf(
      buildIdxPackage({ unload: UNLOAD, images: IMAGES, readme: 'hello' }),
    );
    expect(Object.keys(files).sort()).toEqual([
      'README.txt',
      'data/unload.txt',
      'images/a1.jpg',
      'images/a2.jpg',
    ]);
    expect(strFromU8(files['data/unload.txt'])).toBe('IDX3.01#Aireon#\r\n');
    expect(strFromU8(files['README.txt'])).toBe('hello');
  });

  it('merges extraFiles into the archive alongside the IDX entries', async () => {
    const files = await entriesOf(
      buildIdxPackage({
        unload: UNLOAD,
        images: IMAGES,
        readme: 'hello',
        extraFiles: {
          'swissrets/export.json': new TextEncoder().encode('{"generator":{"version":"1"}}'),
          'swissrets/export.xml': new TextEncoder().encode('<export/>'),
        },
      }),
    );
    expect(Object.keys(files).sort()).toEqual([
      'README.txt',
      'data/unload.txt',
      'images/a1.jpg',
      'images/a2.jpg',
      'swissrets/export.json',
      'swissrets/export.xml',
    ]);
    expect(strFromU8(files['swissrets/export.json'])).toBe('{"generator":{"version":"1"}}');
    expect(strFromU8(files['swissrets/export.xml'])).toBe('<export/>');
    // The IDX side is untouched by the merge.
    expect(strFromU8(files['data/unload.txt'])).toBe('IDX3.01#Aireon#\r\n');
    expect(files['images/a1.jpg']).toEqual(IMAGES[0].data);
  });

  it('treats an empty extraFiles map as no extra files', async () => {
    const files = await entriesOf(
      buildIdxPackage({ unload: UNLOAD, images: [], readme: 'hello', extraFiles: {} }),
    );
    expect(Object.keys(files).sort()).toEqual(['README.txt', 'data/unload.txt']);
  });
});
