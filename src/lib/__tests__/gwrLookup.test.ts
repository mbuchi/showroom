import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  fetchGwrBuildings,
  normalizeGwrResults,
  pickPrimaryBuilding,
  wstwkToFloor,
} from '../gwrLookup';

/** One `find` row — the register returns one per building x entrance. */
function row(featureId: string, attributes: Record<string, unknown>) {
  return { featureId, attributes };
}

/** Stub `fetch` with a single JSON response. */
function mockFetch(body: unknown, ok = true, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('wstwkToFloor', () => {
  it('decodes the ground floor and the upper floors', () => {
    expect(wstwkToFloor(3100)).toBe('0');
    expect(wstwkToFloor(3101)).toBe('1');
    expect(wstwkToFloor(3102)).toBe('2');
    expect(wstwkToFloor(3103)).toBe('3');
    expect(wstwkToFloor(3112)).toBe('12');
  });

  it('decodes the basement band as negative floors', () => {
    expect(wstwkToFloor(3401)).toBe('-1');
    expect(wstwkToFloor(3402)).toBe('-2');
    expect(wstwkToFloor(3405)).toBe('-5');
  });

  it('returns null for missing, non-integer and out-of-band codes', () => {
    expect(wstwkToFloor(null)).toBeNull();
    expect(wstwkToFloor(undefined)).toBeNull();
    expect(wstwkToFloor(3100.5)).toBeNull();
    // 3400 is the band marker, not the first basement.
    expect(wstwkToFloor(3400)).toBeNull();
    expect(wstwkToFloor(3200)).toBeNull();
    expect(wstwkToFloor(0)).toBeNull();
  });
});

describe('normalizeGwrResults', () => {
  it('merges the entrance rows of one building into a single entry', () => {
    const buildings = normalizeGwrResults([
      row('9001_0', {
        egid: 9001,
        gbauj: 1974,
        gastw: 4,
        ganzwhg: 3,
        ewid: [1, 2],
        wstwk: [3100, 3101],
        warea: [88, 96],
        wazim: [3.5, 4.5],
      }),
      row('9001_1', {
        egid: 9001,
        gbauj: 1974,
        gastw: 4,
        ganzwhg: 3,
        ewid: [3],
        wstwk: [3102],
        warea: [122],
        wazim: [5.5],
      }),
    ]);

    expect(buildings).toHaveLength(1);
    expect(buildings[0].egid).toBe('9001');
    expect(buildings[0].yearBuilt).toBe(1974);
    expect(buildings[0].floors).toBe(4);
    expect(buildings[0].dwellingCount).toBe(3);
    expect(buildings[0].dwellings.map((d) => d.ewid)).toEqual(['1', '2', '3']);
    expect(buildings[0].dwellings.map((d) => d.floorLabel)).toEqual(['0', '1', '2']);
    expect(buildings[0].dwellings[2]).toMatchObject({
      floorCode: 3102,
      rooms: 5.5,
      areaM2: 122,
    });
  });

  it('drops a dwelling an earlier entrance row already listed', () => {
    const buildings = normalizeGwrResults([
      row('9002_0', { egid: '9002', ewid: [7], wstwk: [3101], warea: [70], wazim: [3] }),
      row('9002_1', { egid: '9002', ewid: [7], wstwk: [3101], warea: [70], wazim: [3] }),
    ]);

    expect(buildings).toHaveLength(1);
    expect(buildings[0].dwellings).toHaveLength(1);
  });

  it('keeps separate buildings apart', () => {
    const buildings = normalizeGwrResults([
      row('9003_0', { egid: 9003, gastw: 2 }),
      row('9004_0', { egid: 9004, gastw: 6, ganzwhg: 12 }),
    ]);
    expect(buildings.map((b) => b.egid)).toEqual(['9003', '9004']);
  });

  it('coalesces a building-level fact a sibling entrance row is missing', () => {
    const buildings = normalizeGwrResults([
      row('9005_0', { egid: 9005, gbauj: null, gastw: null, ganzwhg: null }),
      row('9005_1', { egid: 9005, gbauj: 2001, gastw: 3, ganzwhg: 5 }),
    ]);
    expect(buildings[0]).toMatchObject({ yearBuilt: 2001, floors: 3, dwellingCount: 5 });
  });

  it('tolerates null entries inside the index-aligned dwelling arrays', () => {
    const buildings = normalizeGwrResults([
      row('9006_0', {
        egid: 9006,
        ewid: [1, 2, 3],
        wstwk: [3100, null, 3401],
        warea: [null, 64, 30],
        wazim: [2.5, null, 1],
      }),
    ]);

    const dwellings = buildings[0].dwellings;
    expect(dwellings).toHaveLength(3);
    expect(dwellings[0]).toMatchObject({ floorLabel: '0', rooms: 2.5, areaM2: null });
    expect(dwellings[1]).toMatchObject({ floorCode: null, floorLabel: null, areaM2: 64 });
    expect(dwellings[2]).toMatchObject({ floorLabel: '-1', rooms: 1, areaM2: 30 });
  });

  it('skips an entirely empty dwelling slot', () => {
    const buildings = normalizeGwrResults([
      row('9007_0', {
        egid: 9007,
        ewid: [1, null],
        wstwk: [3100, null],
        warea: [80, null],
        wazim: [3.5, null],
      }),
    ]);
    expect(buildings[0].dwellings).toHaveLength(1);
  });

  it('accepts a single-dwelling building sent as bare scalars', () => {
    const buildings = normalizeGwrResults([
      row('9008_0', { egid: 9008, ganzwhg: 1, ewid: 1, wstwk: 3100, warea: 145, wazim: 5.5 }),
    ]);
    expect(buildings[0].dwellings).toEqual([
      { ewid: '1', floorCode: 3100, floorLabel: '0', rooms: 5.5, areaM2: 145 },
    ]);
  });

  it('ignores rows without an egid and non-array payloads', () => {
    expect(normalizeGwrResults([row('x', { gastw: 3 })])).toEqual([]);
    expect(normalizeGwrResults(null)).toEqual([]);
    expect(normalizeGwrResults(undefined)).toEqual([]);
    expect(normalizeGwrResults({})).toEqual([]);
  });
});

describe('pickPrimaryBuilding', () => {
  const base = { egid: '0', yearBuilt: null, floors: null, dwellingCount: null, dwellings: [] };

  it('prefers a building with dwellings, then floors, then a year', () => {
    const withDwellings = { ...base, egid: 'a', dwellingCount: 4 };
    const withFloors = { ...base, egid: 'b', floors: 2 };
    const withYear = { ...base, egid: 'c', yearBuilt: 1960 };

    expect(pickPrimaryBuilding([withYear, withFloors, withDwellings])?.egid).toBe('a');
    expect(pickPrimaryBuilding([withYear, withFloors])?.egid).toBe('b');
    expect(pickPrimaryBuilding([{ ...base, egid: 'd' }, withYear])?.egid).toBe('c');
  });

  it('falls back to the first building and to null when empty', () => {
    expect(pickPrimaryBuilding([{ ...base, egid: 'e' }, { ...base, egid: 'f' }])?.egid).toBe('e');
    expect(pickPrimaryBuilding([])).toBeNull();
  });
});

describe('fetchGwrBuildings', () => {
  it('queries the register by EGRID and normalizes the response', async () => {
    const fetchMock = mockFetch({
      results: [
        row('1000_0', { egid: 1000, gastw: 3, ganzwhg: 2, ewid: [1, 2], wstwk: [3100, 3101] }),
      ],
    });

    const buildings = await fetchGwrBuildings('CH000000000001');

    expect(buildings).toHaveLength(1);
    expect(buildings?.[0].dwellings).toHaveLength(2);

    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.origin + url.pathname).toBe(
      'https://api3.geo.admin.ch/rest/services/api/MapServer/find',
    );
    expect(url.searchParams.get('layer')).toBe('ch.bfs.gebaeude_wohnungs_register');
    expect(url.searchParams.get('searchField')).toBe('egrid');
    expect(url.searchParams.get('searchText')).toBe('CH000000000001');
    expect(url.searchParams.get('contains')).toBe('false');
    expect(url.searchParams.get('returnGeometry')).toBe('false');
  });

  it('serves a repeat lookup from the in-memory cache', async () => {
    const fetchMock = mockFetch({ results: [row('1001_0', { egid: 1001, gastw: 2 })] });

    await fetchGwrBuildings('CH000000000002');
    await fetchGwrBuildings('CH000000000002');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array when the register knows nothing about the parcel', async () => {
    mockFetch({ results: [] });
    await expect(fetchGwrBuildings('CH000000000003')).resolves.toEqual([]);
  });

  it('returns null on a non-2xx response', async () => {
    mockFetch({}, false, 503);
    await expect(fetchGwrBuildings('CH000000000004')).resolves.toBeNull();
  });

  it('returns null when the request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(fetchGwrBuildings('CH000000000005')).resolves.toBeNull();
  });

  it('returns null on a malformed body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('not json');
        },
      }),
    );
    await expect(fetchGwrBuildings('CH000000000006')).resolves.toBeNull();
  });

  it('returns null for a blank EGRID without touching the network', async () => {
    const fetchMock = mockFetch({ results: [] });
    await expect(fetchGwrBuildings('   ')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null when the caller already aborted', async () => {
    const fetchMock = mockFetch({ results: [] });
    const ctrl = new AbortController();
    ctrl.abort();

    await expect(fetchGwrBuildings('CH000000000007', ctrl.signal)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
