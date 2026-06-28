import type { AboutModalProps } from '@aireon/shared';

type Translator = (key: string) => string;

export function createShowroomAboutModalProps(
  t: Translator,
): Pick<AboutModalProps, 'wordmark' | 'description' | 'credits' | 'closeLabel'> {
  return {
    wordmark: (
      <>
        sh<span className="text-red-500">oo</span>rm
      </>
    ),
    description: t('about.description'),
    closeLabel: t('about.close'),
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
