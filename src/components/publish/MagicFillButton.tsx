import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { buildListingFacts, hasEnoughFacts, type ListingFactContext } from './listingFacts';
import { generateListingCopy, MagicCreateError, type ListingCopy } from '../../lib/magicCreate';
// Aliased: `signal` is also the name of the AbortSignal this component passes
// into generateListingCopy, and the telemetry client must not shadow it.
import { signal as appSignal } from '../../lib/signal';
import type { ListingDraft } from '../../lib/idx/types';

/** Two-tap window before the armed overwrite disarms itself, matching the
 *  reset button on the same page. */
const CONFIRM_MS = 3000;

type ErrorKind = 'rate' | 'failed';

interface MagicFillButtonProps {
  draft: ListingDraft;
  context: ListingFactContext;
  /** Writes the generated copy into the draft (overwrites both fields). */
  onApply: (copy: ListingCopy) => void;
}

/**
 * "Magic fill" for the listing title and description: one click turns the
 * draft's structured facts into portal copy via the Claire relay.
 *
 * Overwriting existing copy is guarded by the suite's two-tap confirm, and the
 * request is disabled while in flight so an impatient double-click cannot spend
 * two slots of the relay's shared per-IP budget.
 */
export default function MagicFillButton({ draft, context, onApply }: MagicFillButtonProps) {
  const { t, locale } = useI18n();
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<ErrorKind | null>(null);

  const armTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  // Guards the post-await setState calls: an unmount mid-flight (the user
  // navigates away from /publish) must not write into a dead component.
  const aliveRef = useRef(true);

  useEffect(
    () => () => {
      aliveRef.current = false;
      if (armTimer.current) clearTimeout(armTimer.current);
      abortRef.current?.abort();
    },
    [],
  );

  const facts = useMemo(
    () => buildListingFacts(draft, context, locale),
    [draft, context, locale],
  );
  const enabled = hasEnoughFacts(draft);
  const hasCopy = draft.title.trim() !== '' || draft.description.trim() !== '';

  const run = useCallback(async () => {
    setArmed(false);
    setError(null);
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const copy = await generateListingCopy(facts, locale, ctrl.signal);
      if (!aliveRef.current || ctrl.signal.aborted) return;
      onApply(copy);
      void appSignal.send('Publish Magic Create', {
        metaData: { facts: Object.keys(facts).length, locale },
      });
    } catch (err) {
      if (!aliveRef.current || ctrl.signal.aborted) return;
      // A terminal relay failure (the whole model chain was already tried) is
      // never retried automatically — the note below is the retry affordance.
      setError(err instanceof MagicCreateError && err.code === 'rate_limited' ? 'rate' : 'failed');
    } finally {
      if (aliveRef.current) setBusy(false);
    }
  }, [facts, locale, onApply]);

  const handleClick = useCallback(() => {
    if (busy) return;
    if (armTimer.current) clearTimeout(armTimer.current);
    // Replacing copy the user may have written by hand takes two taps; an
    // empty pair of fields has nothing to lose, so it goes straight through.
    if (hasCopy && !armed) {
      setArmed(true);
      setError(null);
      armTimer.current = setTimeout(() => setArmed(false), CONFIRM_MS);
      return;
    }
    void run();
  }, [armed, busy, hasCopy, run]);

  const label = busy
    ? t('page.publish.magic.busy')
    : armed
      ? t('page.publish.magic.confirm')
      : t('page.publish.magic.button');

  return (
    // The tooltip sits on the wrapper, not the button: a disabled button eats
    // its own pointer events, so a title there would never surface — which is
    // exactly the state in which the hint is most needed.
    <div
      className="flex min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-1"
      title={t('page.publish.magic.hint')}
    >
      {error === 'rate' && (
        <p className="min-w-0 text-[11px] leading-snug text-amber-300">
          {t('page.publish.magic.rateLimited')}
        </p>
      )}
      {error === 'failed' && (
        <button
          type="button"
          onClick={handleClick}
          className="min-w-0 rounded-sm text-[11px] leading-snug text-red-300 underline decoration-dotted underline-offset-2 transition-colors hover:text-red-200 focus-ring"
        >
          {t('page.publish.magic.failed')}
        </button>
      )}

      <button
        type="button"
        onClick={handleClick}
        disabled={!enabled || busy}
        aria-busy={busy || undefined}
        className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors focus-ring disabled:cursor-not-allowed disabled:opacity-40 ${
          armed
            ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
            : 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300 enabled:hover:border-cyan-400/50 enabled:hover:bg-cyan-500/20'
        }`}
      >
        <Sparkles size={13} aria-hidden="true" />
        {label}
      </button>
    </div>
  );
}
