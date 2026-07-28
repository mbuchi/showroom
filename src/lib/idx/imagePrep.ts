// Fetches selected gallery images and converts them to portal-ready JPEGs.
import type { ListingImageRef, PreparedImage } from './types';

const MAX_EDGE_PX = 2560;

async function toJpegBytes(blob: Blob): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(blob);
  try {
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2d canvas context unavailable');
    ctx.drawImage(bitmap, 0, 0, width, height);

    const jpegBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!jpegBlob) throw new Error('canvas.toBlob produced no data');
    return new Uint8Array(await jpegBlob.arrayBuffer());
  } finally {
    bitmap.close();
  }
}

export async function prepareListingImages(
  refs: ListingImageRef[],
  getAuthHeader: () => Promise<string | null>,
): Promise<{ prepared: PreparedImage[]; failedFilenames: string[] }> {
  const prepared: PreparedImage[] = [];
  const failedFilenames: string[] = [];
  const authHeader = await getAuthHeader();

  for (const ref of refs) {
    try {
      const response = await fetch(ref.publicUrl, {
        headers: authHeader ? { Authorization: authHeader } : {},
      });
      if (!response.ok) {
        failedFilenames.push(ref.filename);
        continue;
      }
      const blob = await response.blob();
      const data = blob.type === 'image/jpeg' ? new Uint8Array(await blob.arrayBuffer()) : await toJpegBytes(blob);
      prepared.push({ filename: ref.filename, data });
    } catch {
      failedFilenames.push(ref.filename);
    }
  }

  return { prepared, failedFilenames };
}
