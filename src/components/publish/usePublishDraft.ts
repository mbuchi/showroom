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
import { applyParcelPrefill } from '../../lib/publishPrefill';
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
  const persistTimer = useRef<ReturnType<typeof setTimeout>>();

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
    setDraft(normalizeDraft(emptyListingDraft()));
    setPrefillState('idle');
    setPrefillResult(null);
  }, []);

  const prefillFromLocation = useCallback(async (lat: number, lng: number, label: string) => {
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
    setDraft(seedStreetFromLabel(next, label));
    setPrefillResult({
      filled,
      zone: info.zone,
      pricePerM2Living: info.pricePerM2Living,
      buildingCount: info.buildingCount,
    });
    setPrefillState('done');
    void signal.send('Publish Prefill', { lat, lng, metaData: { filled: filled.length } });
  }, []);

  return {
    draft,
    patch,
    patchFeature,
    setImages,
    reset,
    prefillFromLocation,
    prefillState,
    prefillResult,
  };
}
