import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Skeleton, useGlass } from '@aireon/shared';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import { ShowroomAccessGate } from './components/ShowroomAccessGate';
import GalleryView from './components/gallery/GalleryView';
import ReporterSkeleton from './components/reporter/ReporterSkeleton';
import PublishSkeleton from './components/publish/PublishSkeleton';
import { useRoute } from './lib/router';
import { hasCompletedTour, markTourCompleted, TOUR_REQUEST_EVENT } from './lib/tour';
import { PolicyLoadingFeedback } from './components/PolicyLoadingFeedback';

// The reporter pulls in mapbox-gl + leaflet — lazy-loaded so the gallery page
// never downloads the map bundles.
const ReporterView = lazy(() => import('./components/reporter/ReporterView'));

// The portal publisher (IDX 3.01 package export) is its own route and pulls in
// the zip/image-encoding engine — lazy so gallery visitors never download it.
const PublishView = lazy(() => import('./components/publish/PublishView'));

// The guided tour (react-joyride) is lazy too, and only mounts while a tour is
// wanted — first-run visitors, or a "Take the tour" replay from the account
// menu — so returning visitors never download the joyride chunk at all.
const Tour = lazy(() => import('./components/Tour').then((m) => ({ default: m.Tour })));

// Gallery-shaped boot skeleton: faux navbar, search bar, and export-tile
// grid. Shown only on the gallery route - the reporter and publish routes
// have their own page-shaped skeletons.
function GallerySkeleton() {
  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-45 glass-nav">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 sm:px-6">
          <Skeleton width={112} height={20} radius={4} />
          <Skeleton circle width={32} />
        </div>
      </div>
      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <Skeleton height={36} radius={12} className="w-full max-w-md" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="w-full aspect-4/3" radius={12} delay={`${i * 60}ms`} />
          ))}
        </div>
      </main>
    </div>
  );
}

function AppShell() {
  const { isLoading } = useAuth();
  const { pathname } = useRoute();
  const isReporter = pathname === '/reporter';
  const isPublish = pathname === '/publish';

  // Liquid Glass appearance level (persists suite-wide via the shared cookie).
  // Stamp it onto <html> — the SAME element that carries `.dark` (set in
  // main.tsx) — so the compound `.dark[data-glass='N']` glass tokens resolve,
  // including for the account dropdown and any panels portaled to <body>.
  const { level: glassLevel } = useGlass();
  useEffect(() => {
    document.documentElement.setAttribute('data-glass', String(glassLevel));
  }, [glassLevel]);

  // Guided tour: auto-runs once per visitor (localStorage-gated) and can be
  // replayed any time from the account menu's "Take the tour" row, which
  // fires TOUR_REQUEST_EVENT. The Tour component probes the live DOM for its
  // step targets itself; unmounting it is the teardown.
  const [tourActive, setTourActive] = useState(() => !hasCompletedTour());
  useEffect(() => {
    const onRequest = () => setTourActive(true);
    window.addEventListener(TOUR_REQUEST_EVENT, onRequest);
    return () => window.removeEventListener(TOUR_REQUEST_EVENT, onRequest);
  }, []);
  const handleTourClose = useCallback((completed: boolean) => {
    if (completed) markTourCompleted();
    setTourActive(false);
  }, []);

  if (isLoading) {
    // Each route boots into its own page's shape, so a shared deep link
    // (or a hard refresh) never flashes another page's skeleton.
    const skeleton = isReporter
      ? <ReporterSkeleton />
      : isPublish
        ? <PublishSkeleton />
        : <GallerySkeleton />;
    return <PolicyLoadingFeedback label="Loading Showroom…" skeleton={skeleton} />;
  }

  // The gallery, reporter, and publisher are public surfaces. Authentication
  // only unlocks account-backed actions, so signed-out visitors get the same
  // primary UI and can choose Sign in when they need those actions.
  const tour = tourActive ? (
    <Suspense fallback={null}>
      <Tour onClose={handleTourClose} />
    </Suspense>
  ) : null;

  if (isReporter) {
    return (
      <>
        <Suspense fallback={<PolicyLoadingFeedback label="Loading reporter…" skeleton={<ReporterSkeleton />} />}>
          <ReporterView />
        </Suspense>
        {tour}
      </>
    );
  }

  if (isPublish) {
    return (
      <>
        <Suspense fallback={<PolicyLoadingFeedback label="Loading publisher…" skeleton={<PublishSkeleton />} />}>
          <PublishView />
        </Suspense>
        {tour}
      </>
    );
  }

  return (
    <>
      <GalleryView />
      {tour}
    </>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <ShowroomAccessGate>
          <AppShell />
        </ShowroomAccessGate>
      </AuthProvider>
    </I18nProvider>
  );
}
