// Builds the shared `AddressSearch` labels object from the app's `t()`
// function. The reporter welcome card and the reporter/publish address boxes
// all reuse the same `page.reporter.(welcome.)search_*` i18n keys — hoisted
// here once instead of duplicating the same seven `t()` calls per view.

import type { AddressSearchLabels } from '@aireon/shared';

type Translate = (key: string, vars?: Record<string, string | number>) => string;

export function buildSearchLabels(t: Translate): AddressSearchLabels {
  return {
    placeholder: t('page.reporter.search_placeholder'),
    loading: t('page.reporter.welcome.search_loading'),
    noResults: t('page.reporter.welcome.search_no_results'),
    clear: t('page.reporter.welcome.search_clear'),
    recent: t('page.reporter.welcome.search_recent'),
    removeRecent: t('page.reporter.welcome.search_remove_recent'),
    resultsCount: (n: number) => t('page.reporter.welcome.search_results_count', { n }),
  };
}
