import { useEffect } from 'react';
import { CloseButton } from '@aireon/shared';
import { useI18n } from '../contexts/I18nContext';

interface AboutModalProps {
  onClose: () => void;
}

export default function AboutModal({ onClose }: AboutModalProps) {
  const { t } = useI18n();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-modal-title"
        className="relative bg-[#0d1117] text-gray-100 border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm p-6"
      >
        <CloseButton
          onClick={onClose}
          label={t('about.close')}
          size="lg"
          className="absolute top-3 right-3"
        />
        <h2 id="about-modal-title" className="text-lg font-semibold mb-1">
          sh<span className="text-red-500">oo</span>rm
        </h2>
        <p className="text-sm text-gray-400 mb-4">{t('about.description')}</p>
        <div className="border-t border-white/10 pt-3 text-xs text-gray-500 space-y-1">
          <p>
            {t('about.mapData')}:{' '}
            <a
              href="https://www.swisstopo.admin.ch"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-gray-300"
            >
              © swisstopo
            </a>
          </p>
          <p>
            {t('about.renderer')}:{' '}
            <a
              href="https://maplibre.org"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-gray-300"
            >
              MapLibre GL
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
