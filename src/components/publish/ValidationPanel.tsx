import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import type { IdxIssue } from '../../lib/idx/types';

interface ValidationPanelProps {
  issues: IdxIssue[];
}

/** Jump to the control the issue anchors to. Field ids are stamped by
 *  `Field` as `publish-field-<name>`, so anchoring is a plain lookup. */
function focusField(field: string) {
  const el = document.getElementById(`publish-field-${field}`);
  if (!el) return;
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  (el as HTMLElement).focus({ preventScroll: true });
}

/**
 * Live validation readout for the draft. Errors block the export, warnings
 * only inform. Each row jumps to its field so long forms stay navigable.
 */
export default function ValidationPanel({ issues }: ValidationPanelProps) {
  const { t } = useI18n();
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  const row = (issue: IdxIssue, index: number) => {
    const isError = issue.severity === 'error';
    const Icon = isError ? XCircle : AlertTriangle;
    return (
      <li key={`${issue.severity}-${issue.field}-${issue.messageKey}-${index}`}>
        <button
          type="button"
          onClick={() => focusField(issue.field)}
          className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-xs leading-snug transition-colors focus-ring ${
            isError
              ? 'text-red-300 hover:bg-red-500/10'
              : 'text-amber-300 hover:bg-amber-500/10'
          }`}
        >
          <Icon size={14} className="mt-px flex-shrink-0" aria-hidden="true" />
          <span className="min-w-0">{t(`page.publish.${issue.messageKey}`, issue.params)}</span>
        </button>
      </li>
    );
  };

  return (
    <section className="surface rounded-2xl p-4">
      <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {t('page.publish.validation.title')}
      </h2>

      {issues.length === 0 ? (
        <div className="flex items-start gap-2 text-xs leading-snug text-emerald-300">
          <CheckCircle2 size={14} className="mt-px flex-shrink-0" aria-hidden="true" />
          <span>{t('page.publish.validation.ok')}</span>
        </div>
      ) : (
        <ul className="space-y-0.5">
          {errors.map(row)}
          {warnings.map(row)}
        </ul>
      )}
    </section>
  );
}
