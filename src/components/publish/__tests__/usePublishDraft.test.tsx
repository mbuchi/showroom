import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParcelInfo } from '../../../lib/parcelInfo';
import { normalizedPriceUnit } from '../../../lib/publishPriceUnit';
import type { GwrBuilding, GwrDwelling } from '../../../lib/gwrLookup';
import { DRAFT_KEY, usePublishDraft, type PublishDraftApi } from '../usePublishDraft';

// The hook is driven through a real React root (React 18.3 ships `act`), so no
// component-testing dependency is added just for this. Only the impure edges
// are mocked: the parcel lookup, the register lookup and telemetry.
const fetchParcelInfo = vi.hoisted(() => vi.fn());
vi.mock('../../../lib/parcelInfo', () => ({ fetchParcelInfo }));
vi.mock('../../../lib/signal', () => ({ signal: { send: vi.fn(() => Promise.resolve()) } }));

// Only the transport is replaced — `pickPrimaryBuilding` stays real so these
// tests exercise the heuristic the hook actually runs.
const fetchGwrBuildings = vi.hoisted(() => vi.fn());
vi.mock('../../../lib/gwrLookup', async () => {
  const actual =
    await vi.importActual<typeof import('../../../lib/gwrLookup')>('../../../lib/gwrLookup');
  return { ...actual, fetchGwrBuildings };
});

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

function gwrDwelling(overrides: Partial<GwrDwelling> = {}): GwrDwelling {
  return { ewid: '1', floorCode: 3100, floorLabel: '0', rooms: 3.5, areaM2: 88, ...overrides };
}

function gwrBuilding(overrides: Partial<GwrBuilding> = {}): GwrBuilding {
  return {
    egid: '302013',
    yearBuilt: 1974,
    floors: 6,
    dwellingCount: 3,
    dwellings: [],
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
  // Default: the register has nothing. Tests that care opt in explicitly, and
  // no test ever reaches the real api3.geo.admin.ch.
  fetchGwrBuildings.mockResolvedValue(null);
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

describe('usePublishDraft register (GWR) enrichment', () => {
  /** Run a prefill against a parcel whose EGRID the register answers for. */
  async function prefill(buildings: GwrBuilding[] | null) {
    fetchParcelInfo.mockResolvedValueOnce(
      // The parcel record carries none of the fields the register fills, so the
      // blank-only invariant does not mask the register's contribution.
      parcel({ constructionYear: null, buildingFloors: null, flats: null, buildingRooms: null }),
    );
    fetchGwrBuildings.mockResolvedValueOnce(buildings);
    await act(async () => {
      await api().prefillFromLocation(47.3568, 8.5551, 'Hainerweg 6');
    });
  }

  it('fills the dwelling fields when the building holds exactly one unit', async () => {
    await prefill([
      gwrBuilding({
        dwellingCount: 1,
        dwellings: [gwrDwelling({ floorCode: 3102, floorLabel: '2', rooms: 4.5, areaM2: 122 })],
      }),
    ]);

    expect(api().draft.surfaceLiving).toBe('122');
    expect(api().draft.rooms).toBe('4.5');
    expect(api().draft.floor).toBe('2');
    expect(api().draft.numberOfFloors).toBe('6');
    expect(api().gwrDwellings).toEqual([]);
    expect(api().prefillResult?.gwrFilled).toBe(true);
    expect(api().prefillResult?.filled).toContain('surfaceLiving');
  });

  it('offers a picker and fills nothing unit-specific when the building has several', async () => {
    await prefill([
      gwrBuilding({
        dwellings: [
          gwrDwelling({ ewid: '1' }),
          gwrDwelling({ ewid: '2', floorCode: 3101, floorLabel: '1', rooms: 4.5, areaM2: 104 }),
        ],
      }),
    ]);

    expect(api().gwrDwellings).toHaveLength(2);
    expect(api().selectedDwellingEwid).toBeNull();
    expect(api().draft.surfaceLiving).toBe('');
    expect(api().draft.rooms).toBe('');
    expect(api().draft.floor).toBe('');
    // Building-level facts still land.
    expect(api().draft.yearBuilt).toBe('1974');
    expect(api().draft.apartments).toBe('3');
  });

  it('applies a picked unit, then replaces it when a different unit is picked', async () => {
    await prefill([
      gwrBuilding({
        dwellings: [
          gwrDwelling({ ewid: '1' }),
          gwrDwelling({ ewid: '2', floorCode: 3101, floorLabel: '1', rooms: 4.5, areaM2: 104 }),
        ],
      }),
    ]);

    act(() => {
      api().selectDwelling('1');
    });
    expect(api().selectedDwellingEwid).toBe('1');
    expect(api().draft.surfaceLiving).toBe('88');
    expect(api().draft.floor).toBe('0');

    // An explicit second pick overwrites the first — the user changed their
    // mind about which unit the listing is.
    act(() => {
      api().selectDwelling('2');
    });
    expect(api().selectedDwellingEwid).toBe('2');
    expect(api().draft.surfaceLiving).toBe('104');
    expect(api().draft.rooms).toBe('4.5');
    expect(api().draft.floor).toBe('1');
  });

  it('leaves the parcel prefill intact when the register lookup fails', async () => {
    await prefill(null);

    expect(api().prefillState).toBe('done');
    expect(api().draft.street).toBe('Hainerweg 6');
    expect(api().gwrDwellings).toEqual([]);
    expect(api().prefillResult?.gwrFilled).toBe(false);
  });

  it('skips the register entirely when the parcel has no EGRID', async () => {
    fetchParcelInfo.mockResolvedValueOnce(parcel({ egrid: null }));
    await act(async () => {
      await api().prefillFromLocation(47.3568, 8.5551, 'Hainerweg 6');
    });

    expect(fetchGwrBuildings).not.toHaveBeenCalled();
    expect(api().prefillState).toBe('done');
  });

  it('ignores a register response for an address the user already moved off', async () => {
    const pending = deferred<GwrBuilding[] | null>();
    fetchParcelInfo.mockResolvedValueOnce(parcel());
    fetchGwrBuildings.mockReturnValueOnce(pending.promise);

    await act(async () => {
      await api().prefillFromLocation(47.3568, 8.5551, 'Hainerweg 6');
    });

    // A second address supersedes the first while its register call is open.
    fetchParcelInfo.mockResolvedValueOnce(parcel({ address: 'Zweite Strasse 2' }));
    await act(async () => {
      await api().prefillFromLocation(46.948, 7.4474, 'Zweite Strasse 2');
    });

    await act(async () => {
      pending.resolve([gwrBuilding({ dwellings: [gwrDwelling(), gwrDwelling({ ewid: '2' })] })]);
      await pending.promise;
    });

    expect(api().gwrDwellings).toEqual([]);
  });
});
