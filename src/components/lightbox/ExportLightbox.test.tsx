// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchLoadingFeedbackPolicy } from '@aireon/shared';

vi.mock('@aireon/shared', async (importOriginal) => ({
  ...await importOriginal<typeof import('@aireon/shared')>(),
  useFocusTrap: () => ({ current: null }),
}));

vi.mock('../../contexts/I18nContext', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

import ExportLightbox from './ExportLightbox';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: Array<{ root: Root; host: HTMLDivElement }> = [];

async function primeSkeletonPolicy() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      spinner_enabled: false,
      skeleton_enabled: true,
      skeleton_threshold_ms: 500,
      updated_at: null,
    }),
  }));
  await fetchLoadingFeedbackPolicy(true);
}

afterEach(() => {
  for (const item of mounted.splice(0)) {
    act(() => item.root.unmount());
    item.host.remove();
  }
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('ExportLightbox', () => {
  it('keeps the real shared skeleton centered at 70vw by 60vh', async () => {
    await primeSkeletonPolicy();
    vi.useFakeTimers();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    mounted.push({ root, host: container });
    await act(async () => root.render(<ExportLightbox
        images={[{ id: 'image-1', app_source: 'boost', public_url: '/image.webp', original_filename: 'image.webp', width: 1, height: 1, created_at: '2026-08-11T00:00:00Z' } as never]}
        index={0}
        favorites={new Set()}
        deletingIds={new Set()}
        onClose={() => undefined}
        onIndexChange={() => undefined}
        onToggleFavorite={() => undefined}
        onDelete={() => undefined}
      />));

    const host = document.querySelector('[data-lightbox-loading-host="true"]');
    expect(host?.className).toContain('absolute left-1/2 top-1/2');
    expect(host?.className).toContain('-translate-x-1/2 -translate-y-1/2');
    expect(host?.className).toContain('w-[70vw] max-w-3xl h-[60vh] max-h-[calc(100dvh-9rem)]');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    const fill = host?.querySelector('[data-loading-feedback-fill="true"]');
    const sharedLayer = fill?.querySelector(':scope > div') as HTMLElement | null;
    expect(sharedLayer?.style.position).toBe('relative');
    expect(fill?.className).toContain('[&>div]:h-full [&>div]:w-full');
    expect(fill?.className).toContain('[&>div]:flex [&>div]:items-center [&>div]:justify-center');
    expect(sharedLayer?.querySelector('.h-full.w-full')).not.toBeNull();
  });
});
