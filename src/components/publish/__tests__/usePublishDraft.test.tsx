import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParcelInfo } from '../../../lib/parcelInfo';
import { normalizedPriceUnit } from '../../../lib/publishPriceUnit';
import { DRAFT_KEY, usePublishDraft, type PublishDraftApi } from '../usePublishDraft';

// The hook is driven through a real React root (React 18.3 ships `act`), so no
// component-testing dependency is added just for this. Only the two impure
// edges are mocked: the parcel lookup and telemetry.
const fetchParcelInfo = vi.hoisted(() => vi.fn());
vi.mock('../../../lib/parcelInfo', () => ({ fetchParcelInfo }));
vi.mock('../../../lib/signal', () => ({ signal: { send: vi.fn(() => Promise.resolve()) } }));

/** React's act() opt-in. Set locally rather than via a `declare global`, which
 *  would leak the flag into the whole project's type space. */
function enableActEnvironment() {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function parcel(overrides: Partial<ParcelInfo> = {}): ParcelInfo {
  return {
    address: 'Hainerweg 6',
    locality: '8008 Zürich ZH',
    egrid: 'CH339979914032',
    buildingSizeM2: 420,
    buildingVolumeM3: 13364,
    flats: 12,
    zone: 'W3',
    lat: 47.3568,
    lng: 8.5551,
    zip: '8008',
    city: 'Zürich',
    canton: 'ZH',
    parcelAreaM2: 6499,
    constructionYear: 1897,
    buildingFloors: 5,
    buildingRooms: 3.5,
    buildingCount: 4,
    pricePerM2Living: 13062,
    ...overrides,
  };
}

const sink: { api: PublishDraftApi | null } = { api: null };

function Probe() {
  const api = usePublishDraft();
  // Published from an effect rather than during render, so the probe stays a
  // well-behaved component.
  useEffect(() => {
    sink.api = api;
  });
  return null;
}

function api(): PublishDraftApi {
  if (!sink.api) throw new Error('usePublishDraft is not mounted');
  return sink.api;
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  enableActEnvironment();
  localStorage.clear();
  sink.api = null;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<Probe />);
  });
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  vi.clearAllMocks();
});

/** Remounts the probe so `usePublishDraft`'s lazy `useState(loadDraft)`
 *  reruns against whatever is in localStorage right now — the initial
 *  `beforeEach` mount already happened against an empty store. */
function mountFresh() {
  act(() => {
    root.unmount();
  });
  container.remove();
  sink.api = null;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<Probe />);
  });
}

describe('usePublishDraft prefill', () => {
  it('fills the draft from parcel data and reports what it wrote', async () => {
    fetchParcelInfo.mockResolvedValueOnce(parcel());

    await act(async () => {
      await api().prefillFromLocation(47.3568, 8.5551, 'Hainerweg 6, 8008 Zürich');
    });

    expect(api().prefillState).toBe('done');
    expect(api().draft.street).toBe('Hainerweg 6');
    expect(api().draft.zip).toBe('8008');
    expect(api().prefillResult?.filled).toContain('street');
    expect(api().prefillResult?.zone).toBe('W3');
    expect(api().prefillResult?.pricePerM2Living).toBe(13062);
  });

  it('reports nodata but still keeps the picked point and the typed address', async () => {
    fetchParcelInfo.mockResolvedValueOnce(null);

    await act(async () => {
      await api().prefillFromLocation(46.2, 6.1, 'Rue du Test 3');
    });

    expect(api().prefillState).toBe('nodata');
    expect(api().prefillResult).toBeNull();
    expect(api().draft.lat).toBe(46.2);
    expect(api().draft.street).toBe('Rue du Test 3');
  });

  it('lets the newest address win when an earlier lookup resolves last', async () => {
    const slowFirst = deferred<ParcelInfo | null>();
    const fastSecond = deferred<ParcelInfo | null>();
    fetchParcelInfo
      .mockReturnValueOnce(slowFirst.promise)
      .mockReturnValueOnce(fastSecond.promise);

    const first = parcel({
      address: 'Erste Strasse 1',
      zip: '3000',
      city: 'Bern',
      canton: 'BE',
      zone: 'STALE ZONE',
      lat: 46.948,
      lng: 7.4474,
    });
    const second = parcel({
      address: 'Zweite Strasse 2',
      zip: '8001',
      city: 'Zürich',
      canton: 'ZH',
      zone: 'FRESH ZONE',
      lat: 47.3769,
      lng: 8.5417,
    });

    let pFirst!: Promise<void>;
    let pSecond!: Promise<void>;
    await act(async () => {
      pFirst = api().prefillFromLocation(46.948, 7.4474, 'Erste Strasse 1');
      pSecond = api().prefillFromLocation(47.3769, 8.5417, 'Zweite Strasse 2');
    });

    // The newer pick resolves first and owns the form...
    await act(async () => {
      fastSecond.resolve(second);
      await pSecond;
    });
    expect(api().draft.street).toBe('Zweite Strasse 2');
    expect(api().draft.lat).toBe(47.3769);

    // ...then the superseded lookup lands. Without the sequence guard this
    // would overwrite the coordinates and swap the summary to the stale
    // parcel while the text fields still hold the newer address.
    await act(async () => {
      slowFirst.resolve(first);
      await pFirst;
    });

    expect(api().draft.street).toBe('Zweite Strasse 2');
    expect(api().draft.city).toBe('Zürich');
    expect(api().draft.lat).toBe(47.3769);
    expect(api().draft.lng).toBe(8.5417);
    expect(api().prefillResult?.zone).toBe('FRESH ZONE');
    expect(api().prefillState).toBe('done');
  });

  it('ignores a lookup that lands after the draft was reset', async () => {
    const pending = deferred<ParcelInfo | null>();
    fetchParcelInfo.mockReturnValueOnce(pending.promise);

    let running!: Promise<void>;
    await act(async () => {
      running = api().prefillFromLocation(47.3568, 8.5551, 'Hainerweg 6');
    });

    act(() => {
      api().reset();
    });

    await act(async () => {
      pending.resolve(parcel());
      await running;
    });

    expect(api().prefillState).toBe('idle');
    expect(api().prefillResult).toBeNull();
    expect(api().draft.street).toBe('');
    expect(api().draft.zip).toBe('');
  });
});

describe('usePublishDraft legacy priceUnit normalization', () => {
  it('defaults a persisted empty priceUnit to SELL for a SALE draft', () => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ offerType: 'SALE', priceUnit: '', street: 'Altweg 1' }),
    );
    mountFresh();

    expect(api().draft.priceUnit).toBe('SELL');
    expect(api().draft.street).toBe('Altweg 1');
  });

  it('defaults a persisted empty priceUnit to MONTHLY for a RENT draft', () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ offerType: 'RENT', priceUnit: '' }));
    mountFresh();

    expect(api().draft.priceUnit).toBe('MONTHLY');
  });

  it('defaults a priceUnit that no longer matches its offer type', () => {
    // Stale combination: a sale-only unit paired with a rent draft, which
    // can only happen via hand-edited or pre-defaulting-era localStorage.
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ offerType: 'RENT', priceUnit: 'SELLM2' }));
    mountFresh();

    expect(api().draft.priceUnit).toBe('MONTHLY');
  });

  it('keeps a valid persisted priceUnit untouched', () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ offerType: 'RENT', priceUnit: 'YEARLY' }));
    mountFresh();

    expect(api().draft.priceUnit).toBe('YEARLY');
  });

  it('resets to a defaulted priceUnit, never an empty one', () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ offerType: 'RENT', priceUnit: 'WEEKLY' }));
    mountFresh();
    expect(api().draft.priceUnit).toBe('WEEKLY');

    act(() => {
      api().reset();
    });

    expect(api().draft.priceUnit).toBe('SELL');
  });

  it('leaves a user-chosen non-default unit alone on a same-offer-type call', () => {
    // Regression: SegmentedTabs (the offer-type control in ListingForm) fires
    // onChange on every click, including a click on the tab that is already
    // active. ListingForm calls normalizedPriceUnit(draft.priceUnit, id) —
    // not defaultPriceUnit(id) — precisely so that re-clicking the active
    // RENT tab while "Rent per year" is selected does not silently fall back
    // to the MONTHLY default underneath a real, already-typed rent amount.
    expect(normalizedPriceUnit('YEARLY', 'RENT')).toBe('YEARLY');
  });
});
