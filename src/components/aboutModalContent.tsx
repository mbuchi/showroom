import type { AboutModalProps } from '@aireon/shared';

type Translator = (key: string) => string;

export function createShowroomAboutModalProps(
  t: Translator,
): Pick<AboutModalProps, 'wordmark' | 'description' | 'credits' | 'closeLabel' | 'aboutLabel' | 'creditsLabel' | 'hubLabel'> {
  return {
    wordmark: (
      <>
        sh<span className="text-red-500">oo</span>rm
      </>
    ),
    description: t('about.description'),
    closeLabel: t('about.close'),
    aboutLabel: t('about.label'),
    creditsLabel: t('about.credits'),
    hubLabel: t('about.hub'),
    credits: [
      {
        label: t('about.mapData'),
        name: '© swisstopo',
        href: 'https://www.swisstopo.admin.ch',
      },
      {
        label: t('about.renderer'),
        name: 'MapLibre GL',
        href: 'https://maplibre.org',
      },
    ],
  };
}
