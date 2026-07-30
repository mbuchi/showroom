import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../../contexts/I18nContext';
import type { GwrDwelling } from '../../../lib/gwrLookup';
import DwellingPicker from '../DwellingPicker';

function enableActEnvironment() {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
}

function dwelling(overrides: Partial<GwrDwelling> = {}): GwrDwelling {
  return { ewid: '1', floorCode: 3100, floorLabel: '0', rooms: 3.5, areaM2: 88, ...overrides };
}

const UNITS = [
  dwelling(),
  dwelling({ ewid: '2', floorCode: 3102, floorLabel: '2', rooms: 4.5, areaM2: 122 }),
  dwelling({ ewid: '3', floorCode: 3401, floorLabel: '-1', rooms: 1.5, areaM2: 41 }),
];

let container: HTMLDivElement;
let root: Root;

function render(node: React.ReactNode) {
  act(() => {
    root.render(<I18nProvider>{node}</I18nProvider>);
  });
}

beforeEach(() => {
  enableActEnvironment();
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

describe('DwellingPicker', () => {
  it('renders nothing when there is nothing to choose', () => {
    render(<DwellingPicker dwellings={[]} selectedEwid={null} onSelect={() => {}} />);
    expect(container.textContent).toBe('');

    render(<DwellingPicker dwellings={[dwelling()]} selectedEwid={null} onSelect={() => {}} />);
    expect(container.textContent).toBe('');
  });

  it('renders one button per unit and reports the pick', () => {
    const onSelect = vi.fn();
    render(<DwellingPicker dwellings={UNITS} selectedEwid={null} onSelect={onSelect} />);

    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(3);
    expect(buttons[0].textContent).toContain('Ground floor');
    expect(buttons[1].textContent).toBe('Floor 2, 4.5 rooms, 122 m2');
    expect(buttons[2].textContent).toBe('Basement 1, 1.5 rooms, 41 m2');

    act(() => {
      buttons[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onSelect).toHaveBeenCalledWith('2');
  });

  it('marks the selected unit', () => {
    render(<DwellingPicker dwellings={UNITS} selectedEwid="3" onSelect={() => {}} />);
    const pressed = [...container.querySelectorAll('button')].map((b) =>
      b.getAttribute('aria-pressed'),
    );
    expect(pressed).toEqual(['false', 'false', 'true']);
  });

  // The register copy is hand-maintained across four locales; a missing key
  // falls back to the raw key string, which would ship as visible gibberish.
  it.each(['en', 'de', 'fr', 'it'])('resolves every register key in %s', (locale) => {
    localStorage.setItem('showroom:locale', locale);
    render(<DwellingPicker dwellings={UNITS} selectedEwid="1" onSelect={() => {}} />);

    const text = container.textContent ?? '';
    expect(text).not.toContain('page.publish.gwr.');
    expect(text).not.toContain('{n}');
    expect(text).not.toContain('{floor}');
    expect(text).not.toContain('{rooms}');
    expect(text).not.toContain('{area}');
    // The unit count reached the hint, so the picker is actually populated.
    expect(text).toContain('3');
  });
});
