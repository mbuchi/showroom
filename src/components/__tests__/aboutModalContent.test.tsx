import { isValidElement } from 'react';
import { describe, expect, it } from 'vitest';
import { createShowroomAboutModalProps } from '../aboutModalContent';

describe('createShowroomAboutModalProps', () => {
  it('builds the shared AboutModal content from app i18n strings', () => {
    const t = (key: string) => `tx:${key}`;

    const props = createShowroomAboutModalProps(t);

    expect(isValidElement(props.wordmark)).toBe(true);
    expect(props.description).toBe('tx:about.description');
    expect(props.closeLabel).toBe('tx:about.close');
    expect(props.credits).toEqual([
      {
        label: 'tx:about.mapData',
        name: '© swisstopo',
        href: 'https://www.swisstopo.admin.ch',
      },
      {
        label: 'tx:about.renderer',
        name: 'MapLibre GL',
        href: 'https://maplibre.org',
      },
    ]);
  });
});
