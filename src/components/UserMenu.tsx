import { Image as ImageIcon, Sparkles } from 'lucide-react';
import {
  MapUserMenu,
  ReleaseNotesPanel,
  useReleaseNotes,
  type MapUserMenuAction,
  type MapUserMenuProps,
  type PrmLocale,
  type PrmRecord,
} from '@aireon/shared';
import { useI18n } from '../contexts/I18nContext';
import { RELEASES, REPO_URL } from '../data/releaseNotes';
import { errorLogger } from '../lib/errorLog';

interface UserMenuProps {
  exportCount?: number;
  /** Bug-report config — surfaces a "Report a problem" row in the More-tools group. */
  bugReport?: MapUserMenuProps['bugReport'];
}

export default function UserMenu({
  exportCount,
  bugReport = { logger: errorLogger, metaData: { rollout: 'bug-report-suite' } },
}: UserMenuProps) {
  const { t, locale } = useI18n();
  const rn = useReleaseNotes({
    currentVersion: RELEASES[0].version,
    storageKey: 'showroom:lastSeenReleaseVersion',
  });

  const openParcelHere = (rec: PrmRecord) => {
    const params = new URLSearchParams({
      lat: String(rec.parcel_lat),
      lng: String(rec.parcel_lng),
    });
    if (rec.parcel_label) params.set('q', rec.parcel_label);
    window.location.href = `/reporter?${params.toString()}`;
  };

  const toolbarItems: MapUserMenuAction[] = [
    {
      key: 'release-notes',
      label: t('menu.release_notes'),
      icon: <Sparkles size={16} aria-hidden="true" />,
      onClick: rn.openPanel,
      dot: rn.hasUnread,
      signedOut: true,
    },
  ];

  const dropdownSummary =
    typeof exportCount === 'number' ? (
      <div className="flex items-center gap-3 text-xs">
        <ImageIcon size={14} className="text-cyan-400" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-gray-400">{t('menu.in_your_gallery')}</span>
        <span className="font-semibold tabular-nums text-gray-100">{exportCount}</span>
      </div>
    ) : undefined;

  return (
    <>
      <MapUserMenu
        dark
        locale={locale as PrmLocale}
        showSavedParcels
        onOpenSavedParcel={openParcelHere}
        toolbarItems={toolbarItems}
        toolbarLabel={t('menu.more_tools')}
        bugReport={bugReport}
        dropdownSummary={dropdownSummary}
        labels={{
          signIn: t('nav.sign_in'),
          userMenu: t('nav.open_user_menu'),
          viewProfile: t('menu.view_profile'),
          manageProfile: t('menu.view_profile'),
          savedParcels: t('menu.my_saved_parcels'),
          signOut: t('menu.sign_out'),
          active: t('menu.active_session'),
          fallbackUser: t('menu.user_fallback'),
        }}
      />
      {rn.isOpen && (
        <ReleaseNotesPanel
          onClose={rn.closePanel}
          locale={locale}
          releases={RELEASES}
          repoUrl={REPO_URL}
          brandPrefix="showr"
          brandSuffix="m"
        />
      )}
    </>
  );
}
