import { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

interface GuideCard {
  id: string;
  href: string;
  /** Bare host, used as the visible link text — no translation needed. */
  host: string;
}

const CARDS: GuideCard[] = [
  { id: 'smg', href: 'https://www.homegate.ch', host: 'homegate.ch' },
  { id: 'newhome', href: 'https://www.newhome.ch', host: 'newhome.ch' },
  { id: 'flatfox', href: 'https://flatfox.ch', host: 'flatfox.ch' },
];

/**
 * What to do with the downloaded package on each portal. Showroom only builds
 * the file: publication happens on the portal side with the user's own
 * contract and credentials, which the disclaimer states outright.
 */
export default function PortalGuide() {
  const { t } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="surface rounded-2xl p-4">
      <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {t('page.publish.guide.title')}
      </h2>

      <div className="space-y-1">
        {CARDS.map((card) => {
          const open = openId === card.id;
          const panelId = `publish-guide-${card.id}`;
          return (
            <div key={card.id} className="rounded-lg border border-white/5 bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : card.id)}
                aria-expanded={open}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-gray-300 transition-colors hover:text-cyan-300 focus-ring"
              >
                <span className="min-w-0 truncate">{t(`page.publish.guide.${card.id}.title`)}</span>
                <ChevronDown
                  size={14}
                  aria-hidden="true"
                  className={`flex-shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
                />
              </button>
              {open && (
                <div id={panelId} className="px-3 pb-2.5">
                  <p className="text-[11px] leading-relaxed text-gray-400">
                    {t(`page.publish.guide.${card.id}.body`)}
                  </p>
                  <a
                    href={card.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 rounded text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 focus-ring"
                  >
                    {card.host}
                    <ExternalLink size={11} aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] leading-snug text-gray-600">
        {t('page.publish.guide.disclaimer')}
      </p>
    </section>
  );
}
