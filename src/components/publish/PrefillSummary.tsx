import { CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@aireon/shared';
import { useI18n } from '../../contexts/I18nContext';
import type { PrefillResult, PrefillState } from './usePublishDraft';
import { PolicyLoadingFeedback } from '../PolicyLoadingFeedback';

// Outcome of the address prefill, rendered under the address search: what the
// parcel lookup wrote into the form, plus the two parcel facts that inform a
// listing without belonging in any IDX field (zoning text, building count).
// A live region, because the result lands asynchronously after the user picks
// an address and the fill itself happens far down the page.

/** Entries in `filled` that name a feature checkbox rather than a text field,
 *  so the chip picks the matching label namespace. */
const FEATURE_FILLED = new Set(['oldBuilding', 'newBuilding']);

interface PrefillSummaryProps {
  state: PrefillState;
  result: PrefillResult | null;
}

export default function PrefillSummary({ state, result }: PrefillSummaryProps) {
  const { t } = useI18n();

  if (state === 'idle') return null;

  if (state === 'loading') {
    return (
      <PolicyLoadingFeedback label={t('page.publish.prefill.loading')} skeleton={<div className="mt-2.5" role="status" aria-label={t('page.publish.prefill.loading')}>
        <Skeleton height={11} radius={4} className="w-56" />
        <Skeleton height={11} radius={4} delay="80ms" className="mt-1.5 w-40" />
      </div>} />
    );
  }

  if (state === 'nodata') {
    return (
      <p className="mt-2.5 text-xs leading-snug text-gray-500" role="status">
        {t('page.publish.prefill.nodata')}
      </p>
    );
  }

  const filled = result?.filled ?? [];
  const zone = result?.zone ?? null;
  // "1 buildings" would be wrong in every locale, and a single building is the
  // unremarkable case anyway — the line is only interesting when the listing
  // shares its parcel.
  const buildings = result?.buildingCount != null && result.buildingCount > 1
    ? result.buildingCount
    : null;

  return (
    <div className="mt-2.5 space-y-2" role="status">
      <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-300">
        <CheckCircle2 size={13} aria-hidden="true" className="flex-shrink-0" />
        {t('page.publish.prefill.done', { n: filled.length })}
      </p>

      {filled.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {filled.map((name) => (
            <li
              key={name}
              className="inline-flex h-6 items-center rounded-md border border-cyan-400/25 bg-cyan-500/10 px-2 text-xs text-cyan-100"
            >
              {t(
                FEATURE_FILLED.has(name)
                  ? `page.publish.feature.${name}`
                  : `page.publish.field.${name}`,
              )}
            </li>
          ))}
        </ul>
      )}

      {zone && (
        <p className="flex min-w-0 gap-1.5 text-xs text-gray-400">
          <span className="flex-shrink-0 text-gray-500">{t('page.publish.prefill.zone')}</span>
          {/* The harmonized zone is short ("Wohnzonen"), but the municipal
              fallback for parcels without one can run to a full sentence;
              the title attribute keeps the whole value reachable. */}
          <span className="min-w-0 truncate text-gray-300" title={zone}>
            {zone}
          </span>
        </p>
      )}

      {buildings !== null && (
        <p className="text-xs text-gray-500">
          {t('page.publish.prefill.buildings', { n: buildings })}
        </p>
      )}

      {/* Provenance: some of the chips above came from the federal register
          rather than from Aireon's own parcel data. */}
      {result?.gwrFilled && (
        <p className="text-xs text-gray-500">{t('page.publish.gwr.filled')}</p>
      )}
    </div>
  );
}
