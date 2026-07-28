import { useCallback, useEffect, useRef, useState } from 'react';
import {
  emptyListingDraft,
  emptyListingFeatures,
  type ListingDraft,
  type ListingFeatures,
  type ListingImageRef,
} from '../../lib/idx/types';
import { fetchParcelInfo } from '../../lib/parcelInfo';

/** localStorage slot for the in-progress listing. Versioned so a future shape
 *  break can be retired without stranding old drafts in the browser. */
const DRAFT_KEY = 'showroom:publish:draft:v1';

/** Writes are debounced — the form is a controlled component and every
 *  keystroke would otherwise hit localStorage synchronously. */
const PERSIST_DELAY_MS = 400;

/** "8001 Zürich ZH" → zip / city / canton. The canton suffix is optional
 *  because the RES locality string omits it for a few municipalities. */
const LOCALITY_RE = /^(\d{4})\s+(.+?)(?:\s+([A-Z]{2}))?$/;

/** Draft keys that hold a plain string and may be prefilled from parcel data. */
type PrefillableKey =
  | 'street'
  | 'zip'
  | 'city'
  | 'canton'
  | 'refProperty'
  | 'volume'
  | 'apartments';

/** Restore a stored draft, merged over a fresh empty draft so a draft written
 *  by an older build (missing fields) still loads with sane defaults. */
function loadDraft(): ListingDraft {
  const base = emptyListingDraft();
  if (typeof localStorage === 'undefined') return base;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<ListingDraft> | null;
    if (!parsed || typeof parsed !== 'object') return base;
    return {
      ...base,
      ...parsed,
      features: { ...emptyListingFeatures(), ...(parsed.features ?? {}) },
      images: Array.isArray(parsed.images) ? parsed.images : [],
    };
  } catch {
    // Corrupt JSON (hand-edited, quota-truncated) must never break the page.
    return base;
  }
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
  /** True while the parcel lookup behind `prefillFromLocation` is in flight. */
  prefilling: boolean;
}

/**
 * Owns the listing draft: state, localStorage persistence and the
 * address-driven prefill. Pure state plumbing apart from the one parcel
 * lookup, so the publish page stays a thin renderer over it.
 */
export function usePublishDraft(): PublishDraftApi {
  const [draft, setDraft] = useState<ListingDraft>(loadDraft);
  const [prefilling, setPrefilling] = useState(false);
  const persistTimer = useRef<ReturnType<typeof setTimeout>>();

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
    setDraft(emptyListingDraft());
  }, []);

  const prefillFromLocation = useCallback(async (lat: number, lng: number, label: string) => {
    setPrefilling(true);
    try {
      const info = await fetchParcelInfo(lat, lng);
      setDraft((prev) => {
        const next: ListingDraft = { ...prev, lat, lng };
        // Only ever FILL blanks: a prefill must not clobber typed content.
        const fill = (key: PrefillableKey, value: string | null | undefined) => {
          if (!value) return;
          if (next[key].trim().length > 0) return;
          next[key] = value;
        };

        fill('street', info?.address ?? label.trim());
        const locality = info?.locality ?? '';
        const m = LOCALITY_RE.exec(locality);
        if (m) {
          fill('zip', m[1]);
          fill('city', m[2]);
          fill('canton', m[3]);
        }
        fill('refProperty', info?.egrid);
        fill('volume', info?.buildingVolumeM3 != null ? String(Math.round(info.buildingVolumeM3)) : '');
        fill('apartments', info?.flats != null ? String(info.flats) : '');
        return next;
      });
    } finally {
      setPrefilling(false);
    }
  }, []);

  return { draft, patch, patchFeature, setImages, reset, prefillFromLocation, prefilling };
}
