import { ImageOff, Search, Sparkles, ArrowUpRight } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

interface EmptyStateProps {
  variant: 'no-exports' | 'no-results' | 'no-favorites';
  onClear?: () => void;
}

const ROOFS_URL = 'https://swissnovo-toolbox.vercel.app/';

export default function EmptyState({ variant, onClear }: EmptyStateProps) {
  const { t } = useI18n();

  if (variant === 'no-exports') {
    return (
      <div className="text-center py-20 px-6 max-w-md mx-auto" role="status">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 mb-5">
          <Sparkles size={24} aria-hidden="true" className="text-cyan-300" />
        </div>
        <h3 className="text-base font-semibold text-gray-100 mb-2">{t('gallery.empty.no_exports_title')}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          {t('gallery.empty.no_exports_body')}
        </p>
        <a
          href={ROOFS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white shadow-glow-cyan transition-all"
        >
          {t('gallery.empty.open_roofs')}
          <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      </div>
    );
  }

  if (variant === 'no-favorites') {
    return (
      <div className="text-center py-16 px-6 max-w-md mx-auto" role="status">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 mb-4">
          <Sparkles size={20} aria-hidden="true" className="text-amber-300" />
        </div>
        <h3 className="text-sm font-semibold text-gray-100 mb-1">{t('gallery.empty.no_favorites_title')}</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          {t('gallery.empty.no_favorites_body_prefix')}{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-ink-700 border border-white/5 text-[10px] font-medium">F</kbd>{' '}
          {t('gallery.empty.no_favorites_body_suffix')}
        </p>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="mt-5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
          >
            {t('gallery.empty.show_all')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-16 px-6 max-w-md mx-auto" role="status">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-ink-800 mb-4">
        <Search size={20} aria-hidden="true" className="text-gray-500" />
      </div>
      <h3 className="text-sm font-semibold text-gray-100 mb-1">{t('gallery.empty.no_matches_title')}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">
        {t('gallery.empty.no_matches_body')}
      </p>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
        >
          {t('gallery.empty.reset_filters')}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="text-center py-16 px-6 max-w-md mx-auto" role="alert">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 mb-4">
        <ImageOff size={20} aria-hidden="true" className="text-red-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-100 mb-1">{t('gallery.error.title')}</h3>
      <p className="text-xs text-gray-400 leading-relaxed break-words">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 px-4 py-2 rounded-lg text-xs font-semibold bg-ink-700 hover:bg-ink-600 text-gray-100"
        >
          {t('parcels.try_again')}
        </button>
      )}
    </div>
  );
}
