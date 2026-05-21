import { toPng } from 'html-to-image';

// Capture one widget card's map area to a PNG data URL. The selector targets
// the inner `.reporter-capture` element whose data-capture-id matches; any
// node tagged `data-capture-skip="true"` (checkbox, status badge, retry
// button) is filtered out so the snapshot is just the basemap and its
// SwissNovo overlays/scrim/metric.
//
// Requires MapboxMini's `preserveDrawingBuffer: true` to be on, otherwise
// WebGL canvases come out blank.
export async function captureWidgetSnapshot(captureId: string): Promise<string | null> {
  const el = document.querySelector<HTMLElement>(
    `.reporter-capture[data-capture-id="${captureId}"]`,
  );
  if (!el) return null;

  try {
    return await toPng(el, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: '#0b0d10',
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return true;
        return node.dataset.captureSkip !== 'true';
      },
    });
  } catch {
    return null;
  }
}

/** Capture many widgets in parallel; failures resolve to null. */
export async function captureMany(
  ids: string[],
): Promise<Record<string, string | null>> {
  const entries = await Promise.all(
    ids.map(async (id) => [id, await captureWidgetSnapshot(id)] as const),
  );
  return Object.fromEntries(entries);
}
