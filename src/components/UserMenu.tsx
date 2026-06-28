import { useState } from 'react';
import { Image as ImageIcon, Info, Sparkles } from 'lucide-react';
import {
  AboutModal,
  MapUserMenu,
  ReleaseNotesPanel,
  useReleaseNotes,
  useGlass,
  buildGlassMenuItem,
  type MapUserMenuAction,
  type MapUserMenuProps,
  type PrmLocale,
  type PrmRecord,
} from '@aireon/shared';
import { useI18n } from '../contexts/I18nContext';
import { RELEASES, REPO_URL } from '../data/releaseNotes';
import { errorLogger } from '../lib/errorLog';
import { createShowroomAboutModalProps } from './aboutModalContent';

interface UserMenuProps {
  exportCount?: number;
  /** Bug-report config — surfaces a "Report a problem" row in the More-tools group. */
  bugReport?: MapUserMenuProps['bugReport'];
  /**
   * "Share this view" row, owned by the Navbar (it holds the link-copy state +
   * "Link copied" toast). Prepended to the "More tools" group so it sits at the
   * very top, ahead of What's new / appearance.
   */
  shareAction?: MapUserMenuAction;
}

export default function UserMenu({
  exportCount,
  bugReport = { logger: errorLogger, metaData: { rollout: 'bug-report-suite' } },
  shareAction,
}: UserMenuProps) {
  const { t, locale } = useI18n();
  // Liquid Glass appearance picker (persists suite-wide via the shared cookie).
  const { level: glassLevel, setLevel: setGlassLevel } = useGlass();
  const rn = useReleaseNotes({
    currentVersion: RELEASES[0].version,
    storageKey: 'showroom:lastSeenReleaseVersion',
  });
  const [showAbout, setShowAbout] = useState(false);

  const openParcelHere = (rec: PrmRecord) => {
    const params = new URLSearchParams({
      lat: String(rec.parcel_lat),
      lng: String(rec.parcel_lng),
    });
    if (rec.parcel_label) params.set('q', rec.parcel_label);
    window.location.href = `/reporter?${params.toString()}`;
  };

  // showroom has no navbar settings gear (no shared MapToolbar), so the Liquid
  // Glass picker lives in the account menu's "More tools" group as an inline
  // expandable Off · Frosted · Liquid disclosure, public so anonymous visitors
  // can adjust it too.
  const toolbarItems: MapUserMenuAction[] = [
    // "Share this view" sits at the very top of the group (moved out of the
    // navbar). Owned by the Navbar so it can flash the "Link copied" toast.
    ...(shareAction ? [shareAction] : []),
    {
      key: 'release-notes',
      label: t('menu.release_notes'),
      icon: <Sparkles size={16} aria-hidden="true" />,
      onClick: rn.openPanel,
      dot: rn.hasUnread,
      signedOut: true,
    },
    { ...buildGlassMenuItem({ level: glassLevel, setLevel: setGlassLevel, locale }), signedOut: true },
    {
      key: 'about',
      label: t('about.menu'),
      icon: <Info size={16} aria-hidden="true" />,
      onClick: () => setShowAbout(true),
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
        // Search history is now a navbar button (the History icon), so suppress
        // the menu's built-in "My search history" row to avoid duplicating it.
        showSearchHistory={false}
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
          glassLevel={glassLevel}
        />
      )}
      {showAbout && (
        <AboutModal
          {...createShowroomAboutModalProps(t)}
          glassLevel={glassLevel}
          dark
          onClose={() => setShowAbout(false)}
        />
      )}
    </>
  );
}
