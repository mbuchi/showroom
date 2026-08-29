import { useCallback, useEffect, useRef, useState } from 'react';
import {
  emptyListingDraft,
  emptyListingFeatures,
  type ListingDraft,
  type ListingFeatures,
  type ListingImageRef,
} from '../../lib/idx/types';
import { fetchParcelInfo } from '../../lib/parcelInfo';
import { normalizedPriceUnit } from '../../lib/publishPriceUnit';
import {
  fetchGwrBuildings,
  pickPrimaryBuilding,
  type GwrBuilding,
  type GwrDwelling,
} from '../../lib/gwrLookup';
import { applyGwrPrefill, applyParcelPrefill } from '../../lib/publishPrefill';
import { signal } from '../../lib/signal';

/** localStorage slot for the in-progress listing. Versioned so a future shape
 *  break can be retired without stranding old drafts in the browser.
 *  Exported for the test suite, which seeds legacy drafts under this key. */
export const DRAFT_KEY = 'showroom:publish:draft:v1';

/** Writes are debounced — the form is a controlled component and every
 *  keystroke would otherwise hit localStorage synchronously. */
const PERSIST_DELAY_MS = 400;

/** priceUnit never rests on '' — an offer-type switch (see ListingForm)
 *  always assigns the matching default, so the only way it can be empty or
 *  mismatched here is a draft persisted by a build that predates that rule. */
function normalizeDraft(draft: ListingDraft): ListingDraft {
  return { ...draft, priceUnit: normalizedPriceUnit(draft.priceUnit, draft.offerType) };
}

/** Restore a stored draft, merged over a fresh empty draft so a draft written
 *  by an older build (missing fields) still loads with sane defaults. */
function loadDraft(): ListingDraft {
  const base = emptyListingDraft();
  if (typeof localStorage === 'undefined') return normalizeDraft(base);
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return normalizeDraft(base);
    const parsed = JSON.parse(raw) as Partial<ListingDraft> | null;
    if (!parsed || typeof parsed !== 'object') return normalizeDraft(base);
    return normalizeDraft({
      ...base,
      ...parsed,
      features: { ...emptyListingFeatures(), ...(parsed.features ?? {}) },
      images: Array.isArray(parsed.images) ? parsed.images : [],
    });
  } catch {
    // Corrupt JSON (hand-edited, quota-truncated) must never break the page.
    return normalizeDraft(base);
  }
}

export type PrefillState = 'idle' | 'loading' | 'done' | 'nodata';

/** What the last successful prefill wrote, plus the parcel facts that inform
 *  the listing without belonging in any IDX field. Session-only: never
 *  persisted with the draft, so a reload starts from 'idle'. */
export interface PrefillResult {
  filled: string[];
  zone: string | null;
  pricePerM2Living: number | null;
  buildingCount: number | null;
  /** True once the federal building and dwelling register (GWR) contributed at
   *  least one field, so the summary can name where those numbers came from. */
  gwrFilled: boolean;
}

export interface PublishDraftApi {
  draft: ListingDraft;
  patch: (partial: Partial<ListingDraft>) => void;
  patchFeature: (key: keyof ListingFeatures, value: ListingFeatures[keyof ListingFeatures]) => void;
  setImages: (refs: ListingImageRef[]) => void;
  reset: () => void;
  /** Fills location + parcel facts from a picked address, never overwriting
   *  anything the user already typed. */
  prefillFromLocation: (lat: number, lng: number, label: string) => Promise<void>;
  /** Lifecycle of the parcel lookup behind `prefillFromLocation`. */
  prefillState: PrefillState;
  /** Outcome of the last successful prefill, or null before/without one. */
  prefillResult: PrefillResult | null;
  /** Units the register lists in the primary building, populated ONLY when
   *  there are several — one unit is auto-filled instead, and zero means the
   *  register has no dwelling rows here. Drives the picker. */
  gwrDwellings: GwrDwelling[];
  /** EWID of the unit the user picked, or null while none is picked. */
  selectedDwellingEwid: string | null;
  /** Apply one register dwelling to the draft. Unlike every other prefill this
   *  OVERWRITES the three dwelling fields — see `applyGwrPrefill`. */
  selectDwelling: (ewid: string) => void;
}

/** Geocoder fallback for the street line: the picked address label seeds it
 *  when RES has no address for the point, preserving the pre-prefill behavior.
 *  Never clobbers a typed value, and never counts as a prefilled field —
 *  the label comes from the geocoder, not from the parcel data. */
function seedStreetFromLabel(draft: ListingDraft, label: string): ListingDraft {
  const trimmed = label.trim();
  if (trimmed === '' || draft.street.trim() !== '') return draft;
  return { ...draft, street: trimmed };
}

/**
 * Owns the listing draft: state, localStorage persistence and the
 * address-driven prefill. Pure state plumbing apart from the one parcel
 * lookup, so the publish page stays a thin renderer over it.
 */
export function usePublishDraft(): PublishDraftApi {
  const [draft, setDraft] = useState<ListingDraft>(loadDraft);
  const [prefillState, setPrefillState] = useState<PrefillState>('idle');
  const [prefillResult, setPrefillResult] = useState<PrefillResult | null>(null);
  const [gwrDwellings, setGwrDwellings] = useState<GwrDwelling[]>([]);
  const [selectedDwellingEwid, setSelectedDwellingEwid] = useState<string | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // What the last register lookup found, kept in a ref so `selectDwelling`
  // stays a stable callback the picker can hold across renders.
  const gwrRef = useRef<{ building: GwrBuilding; dwellings: GwrDwelling[]; buildings: number } | null>(
    null,
  );

  // Latest draft, readable from the async prefill without making the callback
  // depend on (and be recreated by) every keystroke.
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  // Only the newest address may write. Parcel lookups resolve out of order
  // (a cached hit returns in milliseconds, a cold RES round-trip in seconds),
  // and a late loser would otherwise overwrite the coordinates and the summary
  // of the address the user actually picked — while the text fields still hold
  // the newer one. That mismatch is exportable into an IDX package, so it has
  // to be impossible rather than unlikely.
  const prefillSeq = useRef(0);
  const prefillAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // Private mode / quota exceeded — the draft simply stays in memory.
      }
    }, PERSIST_DELAY_MS);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [draft]);

  const patch = useCallback((partial: Partial<ListingDraft>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const patchFeature = useCallback(
    (key: keyof ListingFeatures, value: ListingFeatures[keyof ListingFeatures]) => {
      setDraft((prev) => ({ ...prev, features: { ...prev.features, [key]: value } }));
    },
    [],
  );

  const setImages = useCallback((refs: ListingImageRef[]) => {
    setDraft((prev) => ({ ...prev, images: refs }));
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Ignore — the state reset below is what the user actually sees.
    }
    // Supersede any in-flight lookup too, so a late response cannot refill the
    // draft the user just cleared.
    prefillSeq.current += 1;
    prefillAbort.current?.abort();
    const empty = normalizeDraft(emptyListingDraft());
    setDraft(empty);
    draftRef.current = empty;
    setPrefillState('idle');
    setPrefillResult(null);
    gwrRef.current = null;
    setGwrDwellings([]);
    setSelectedDwellingEwid(null);
  }, []);

  /**
   * Write a register fill into the draft and fold what it wrote into the
   * prefill summary.
   *
   * `draftRef` is updated synchronously alongside `setDraft` because the two
   * register writes (auto pass, then a pick) can land before React has flushed
   * the effect that mirrors state into the ref — reading a stale ref would
   * silently drop the earlier fill.
   */
  const commitGwrFill = useCallback(
    (building: GwrBuilding, dwelling: GwrDwelling | null, overwriteDwellingFields: boolean) => {
      const { draft: next, filled } = applyGwrPrefill(draftRef.current, building, dwelling, {
        overwriteDwellingFields,
      });
      draftRef.current = next;
      setDraft(next);
      if (filled.length === 0) return;
      // The parcel prefill may already have claimed a field name; the chips are
      // keyed by name, so a duplicate would collide rather than inform.
      setPrefillResult((prev) =>
        prev === null
          ? prev
          : {
              ...prev,
              filled: [...prev.filled, ...filled.filter((name) => !prev.filled.includes(name))],
              gwrFilled: true,
            },
      );
    },
    [],
  );

  const selectDwelling = useCallback(
    (ewid: string) => {
      const found = gwrRef.current;
      if (!found) return;
      const dwelling = found.dwellings.find((d) => d.ewid === ewid);
      if (!dwelling) return;

      // Explicit pick: the user just named the unit this listing is, so the
      // dwelling fields overwrite. Building-level fields stay blank-only, and
      // re-applying them here is a no-op after the automatic pass.
      commitGwrFill(found.building, dwelling, true);
      setSelectedDwellingEwid(ewid);
      void signal.send('Publish GWR Prefill', {
        metaData: {
          buildings: found.buildings,
          dwellings: found.dwellings.length,
          picked: true,
        },
      });
    },
    [commitGwrFill],
  );

  /**
   * Second, optional leg of the prefill: dwelling-level facts from the federal
   * building and dwelling register. Fire-and-forget behind the parcel fill, so
   * a register outage, a parcel without an EGRID or a malformed response leaves
   * the parcel prefill exactly as it landed. Guarded by the same sequence
   * number, because it resolves later than the parcel lookup it follows.
   */
  const enrichFromGwr = useCallback(
    async (egrid: string, seq: number, abortSignal: AbortSignal) => {
      const buildings = await fetchGwrBuildings(egrid, abortSignal).catch(() => null);
      if (seq !== prefillSeq.current) return;
      if (!buildings || buildings.length === 0) return;

      const building = pickPrimaryBuilding(buildings);
      if (!building) return;

      const dwellings = building.dwellings;
      gwrRef.current = { building, dwellings, buildings: buildings.length };

      // One unit means there is nothing to choose, so fill it. Several units
      // means the register cannot tell us which one is for sale — offer the
      // picker instead of guessing.
      const soleDwelling = dwellings.length === 1 ? dwellings[0] : null;
      commitGwrFill(building, soleDwelling, false);
      setGwrDwellings(dwellings.length > 1 ? dwellings : []);
      setSelectedDwellingEwid(null);

      void signal.send('Publish GWR Prefill', {
        metaData: {
          buildings: buildings.length,
          dwellings: dwellings.length,
          picked: false,
        },
      });
    },
    [commitGwrFill],
  );

  const prefillFromLocation = useCallback(
    async (lat: number, lng: number, label: string) => {
      const seq = ++prefillSeq.current;
      // Drop the previous lookup off the wire. The seq check below is what
      // actually guarantees correctness (an abort can land too late, and a
      // cached hit never touches the network at all); this just stops paying
      // for a response nobody will read.
      prefillAbort.current?.abort();
      const ctrl = new AbortController();
      prefillAbort.current = ctrl;

      setPrefillState('loading');
      setPrefillResult(null);
      // A new address invalidates the previous building's unit list — leaving
      // it on screen would offer units from the address the user just left.
      gwrRef.current = null;
      setGwrDwellings([]);
      setSelectedDwellingEwid(null);
      // fetchParcelInfo swallows its own failures, but a prefill must never be
      // the thing that breaks the page.
      const info = await fetchParcelInfo(lat, lng, ctrl.signal).catch(() => null);

      // Superseded while in flight: a newer address already owns the form.
      if (seq !== prefillSeq.current) return;

      if (!info) {
        // No parcel facts here — still record the picked point and the typed
        // address so the listing keeps its map pin.
        setDraft((prev) => seedStreetFromLabel({ ...prev, lat, lng }, label));
        setPrefillState('nodata');
        return;
      }

      const { draft: next, filled } = applyParcelPrefill(draftRef.current, info, new Date());
      const seeded = seedStreetFromLabel(next, label);
      // Sync the ref too: the register leg below reads it before React has
      // flushed this render.
      draftRef.current = seeded;
      setDraft(seeded);
      setPrefillResult({
        filled,
        zone: info.zone,
        pricePerM2Living: info.pricePerM2Living,
        buildingCount: info.buildingCount,
        gwrFilled: false,
      });
      setPrefillState('done');
      void signal.send('Publish Prefill', { lat, lng, metaData: { filled: filled.length } });

      // Dwelling-level enrichment, keyed on the parcel's EGRID. Without one
      // there is nothing to query, so the parcel prefill above is the whole
      // result. (A coordinate-based identify fallback for parcels RES has no
      // EGRID for is deliberately out of scope here.)
      if (info.egrid) {
        void enrichFromGwr(info.egrid, seq, ctrl.signal);
      }
    },
    [enrichFromGwr],
  );

  return {
    draft,
    patch,
    patchFeature,
    setImages,
    reset,
    prefillFromLocation,
    prefillState,
    prefillResult,
    gwrDwellings,
    selectedDwellingEwid,
    selectDwelling,
  };
}
