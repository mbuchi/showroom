// Fetches selected gallery images and converts them to portal-ready JPEGs.
// STUB: the engine task replaces the body.
import type { ListingImageRef, PreparedImage } from './types';

export async function prepareListingImages(
  refs: ListingImageRef[],
  getAuthHeader: () => Promise<string | null>,
): Promise<{ prepared: PreparedImage[]; failedFilenames: string[] }> {
  void refs;
  void getAuthHeader;
  return { prepared: [], failedFilenames: [] };
}
