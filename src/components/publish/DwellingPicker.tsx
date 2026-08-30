import { Building2, Check } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { describeDwelling } from '../../lib/gwrLabels';
import type { GwrDwelling } from '../../lib/gwrLookup';

// Unit picker for a building the federal register lists several dwellings in.
// The automatic prefill deliberately fills nothing unit-specific there — a
// listing for the 4.5-room top floor must not inherit the 2.5-room ground floor
// unit's numbers — so this is where the user tells us which one they mean.

interface DwellingPickerProps {
  dwellings: GwrDwelling[];
  selectedEwid: string | null;
  onSelect: (ewid: string) => void;
}

export default function DwellingPicker({
  dwellings,
  selectedEwid,
  onSelect,
}: DwellingPickerProps) {
  const { t } = useI18n();

  // A single unit is auto-filled upstream, so there is nothing to pick.
  if (dwellings.length < 2) return null;

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/2 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-200">
        <Building2 size={13} aria-hidden="true" className="shrink-0 text-cyan-400" />
        {t('page.publish.gwr.pick')}
      </p>
      <p className="mt-1 text-xs leading-snug text-gray-500">
        {t('page.publish.gwr.pickHint', { n: dwellings.length })}
      </p>

      {/* A large building can list dozens of units; the list scrolls inside its
          own box so the prefill card keeps a sane height. */}
      <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-0.5">
        {dwellings.map((dwelling) => {
          const selected = dwelling.ewid === selectedEwid;
          return (
            <li key={dwelling.ewid}>
              <button
                type="button"
                onClick={() => onSelect(dwelling.ewid)}
                aria-pressed={selected}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors focus-ring ${
                  selected
                    ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-100'
                    : 'border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <span className="min-w-0 truncate">{describeDwelling(t, dwelling)}</span>
                {selected && (
                  <Check
                    size={13}
                    aria-hidden="true"
                    className="shrink-0 text-cyan-300"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
