// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchLoadingFeedbackPolicy } from '@aireon/shared';

vi.mock('../contexts/I18nContext', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

import ExportCard from './gallery/ExportCard';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: Array<{ root: Root; host: HTMLDivElement }> = [];

async function primeSpinnerPolicy() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      spinner_enabled: true,
      skeleton_enabled: false,
      skeleton_threshold_ms: 3000,
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
  vi.unstubAllGlobals();
});

describe('Showroom image loading owner', () => {
  it('centers the real shared spinner inside the full-size relative feedback layer', async () => {
    await primeSpinnerPolicy();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    mounted.push({ root, host: container });
    await act(async () => root.render(<ExportCard
        image={{ id: 'image-1', app_source: 'boost', public_url: '/image.webp', original_filename: 'image.webp', width: 1, height: 1, created_at: '2026-08-11T00:00:00Z' } as never}
        isFavorite={false}
        onOpen={() => undefined}
        onToggleFavorite={() => undefined}
        onDelete={() => undefined}
      />));

    const fill = container.querySelector('[data-loading-feedback-fill="true"]');
    expect(fill?.className).toContain('pointer-events-none absolute inset-0');
    expect(fill?.className).toContain('[&>div]:h-full [&>div]:w-full');
    expect(fill?.className).toContain('[&>div]:flex [&>div]:items-center [&>div]:justify-center');

    const sharedLayer = fill?.querySelector(':scope > div') as HTMLElement | null;
    expect(sharedLayer?.style.position).toBe('relative');
    expect(sharedLayer?.querySelector('[role="status"][aria-label="Loading image…"]')).not.toBeNull();
  });
});
