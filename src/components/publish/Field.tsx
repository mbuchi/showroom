import type { ReactNode } from 'react';

export interface FieldOption {
  value: string;
  label: string;
}

interface FieldProps {
  /** Draft field name. Also drives the DOM id `publish-field-<name>`, which is
   *  what ValidationPanel focuses when an issue row is clicked. */
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  variant?: 'input' | 'textarea' | 'select';
  /** `input` variant only. */
  type?: 'text' | 'email' | 'tel' | 'url';
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url';
  /** `select` variant only. */
  options?: FieldOption[];
  placeholder?: string;
  /** Red border — set when an error-severity issue anchors to this field. */
  error?: boolean;
  /** Small helper line under the control. */
  hint?: ReactNode;
  /** Right-aligned counter beside the label, e.g. "42/70". */
  counter?: string;
  className?: string;
}

// max-lg:text-base (16px) keeps iOS Safari from auto-zooming the page on
// focus — it zooms any control rendered below 16px (suite standard).
const CONTROL_BASE =
  'w-full rounded-lg bg-ink-900/70 border px-3 text-sm max-lg:text-base text-gray-200 placeholder-gray-600 focus-ring transition-colors';

/**
 * One labelled form control on the publish page. Input, textarea and select all
 * share the same shell so the long IDX listing form stays visually uniform and
 * every control keeps its `publish-field-*` id for validation focus jumps.
 */
export default function Field({
  name,
  label,
  value,
  onChange,
  variant = 'input',
  type = 'text',
  inputMode,
  options,
  placeholder,
  error = false,
  hint,
  counter,
  className = '',
}: FieldProps) {
  const id = `publish-field-${name}`;
  const border = error ? 'border-red-400/40' : 'border-white/10 hover:border-white/20';
  const controlClass = `${CONTROL_BASE} ${border}`;

  return (
    <div className={`min-w-0 ${className}`}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="block text-xs font-medium text-gray-400">
          {label}
        </label>
        {counter && <span className="text-[10px] tabular-nums text-gray-600">{counter}</span>}
      </div>

      {variant === 'textarea' && (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={error || undefined}
          className={`${controlClass} min-h-[120px] py-2 leading-relaxed resize-y`}
        />
      )}

      {variant === 'select' && (
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error || undefined}
          className={`${controlClass} h-9`}
        >
          {(options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-ink-900 text-gray-200">
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {variant === 'input' && (
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={error || undefined}
          className={`${controlClass} h-9`}
        />
      )}

      {hint && <p className="mt-1 text-[11px] leading-snug text-gray-600">{hint}</p>}
    </div>
  );
}
