import { useCallback, useState } from 'react';
import { Compass, Image as ImageIcon, Info, Sparkles } from 'lucide-react';
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
  type Release,
} from '@aireon/shared';
import { useI18n } from '../contexts/I18nContext';
import { CURRENT_VERSION, REPO_URL } from '../data/releaseMeta';
import { errorLogger } from '../lib/errorLog';
import { navigate } from '../lib/router';
import { requestTour } from '../lib/tour';
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
    currentVersion: CURRENT_VERSION,
    storageKey: 'showroom:lastSeenReleaseVersion',
  });
  const [showAbout, setShowAbout] = useState(false);

  // The full changelog (~2k lines + its icons) is fetched only when the What's-new
  // panel is opened, keeping it out of the eager initial bundle. The dynamic
  // import is cached after the first open, so re-opening resolves instantly.
  const [releases, setReleases] = useState<Release[] | null>(null);
  const openReleaseNotes = useCallback(() => {
    void import('../data/releaseNotes').then((m) => setReleases(m.RELEASES));
    rn.openPanel();
  }, [rn]);

  // Open a saved parcel in the reporter. Built from the LIVE url so theme,
  // lang and the other appearance params survive the jump, then pointed at
  // /reporter. The stale selection identity is dropped rather than re-seeded:
  // `q` used to carry the record's own label, which can name a different
  // parcel than the coordinates it travels with. `select` goes too, because
  // @aireon/shared v1.185.0+ stamps `select=off` when a parcel panel is closed.
  const openParcelHere = (rec: PrmRecord) => {
    const url = new URL(window.location.href);
    url.pathname = '/reporter';
    url.searchParams.set('lat', String(rec.parcel_lat));
    url.searchParams.set('lng', String(rec.parcel_lng));
    for (const stale of ['q', 'address', 'egrid', 'EGRID', 'parcel_id', 'select']) {
      url.searchParams.delete(stale);
    }
    window.location.href = url.toString();
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
      onClick: openReleaseNotes,
      dot: rn.hasUnread,
      signedOut: true,
    },
    // Replay the guided onboarding tour (suite standard: Compass row, visible
    // signed out too). The app shell listens for the event and mounts the tour.
    {
      key: 'tour',
      label: t('tour.menu'),
      icon: <Compass size={16} aria-hidden="true" />,
      onClick: requestTour,
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

  // The gallery count used to be a custom summary node. That prop sets
  // `hasCustomDropdownSummary` in the shared shell, which suppresses the whole
  // built-in saved-parcels block - and because only GalleryView passes
  // `exportCount`, the block appeared on /reporter and /publish and vanished on
  // the gallery, which is also `/` and every unknown path. Same menu, two
  // shapes, decided by the route. The count is now an account-section row, so
  // the standard block renders everywhere.
  // `badge` must be a STRING: a raw 0 is falsy and would render no badge at all.
  const extraItems: MapUserMenuAction[] =
    typeof exportCount === 'number'
      ? [{
          key: 'gallery-count',
          label: t('menu.in_your_gallery'),
          icon: <ImageIcon size={16} aria-hidden="true" />,
          badge: String(exportCount),
          onClick: () => navigate('/'),
        }]
      : [];

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
        extraItems={extraItems}
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
      {rn.isOpen && releases && (
        <ReleaseNotesPanel
          onClose={rn.closePanel}
          locale={locale}
          releases={releases}
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
          locale={locale}
          onClose={() => setShowAbout(false)}
        />
      )}
    </>
  );
}
