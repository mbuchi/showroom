import { lazy, Suspense } from 'react';
import { Skeleton } from '@swissnovo/shared';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import GalleryView from './components/gallery/GalleryView';
import ReporterSkeleton from './components/reporter/ReporterSkeleton';
import { useRoute } from './lib/router';

// The reporter pulls in mapbox-gl + leaflet — lazy-loaded so the gallery page
// never downloads the map bundles.
const ReporterView = lazy(() => import('./components/reporter/ReporterView'));

// App-boot skeleton: a faux navbar and a coarse content shell, shown while
// auth resolves on non-reporter routes (the reporter route has its own).
function RouteSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-[45] glass-nav">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 sm:px-6">
          <Skeleton width={112} height={20} radius={4} />
          <Skeleton circle width={32} />
        </div>
      </div>
      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <Skeleton height={36} radius={12} className="w-full max-w-md" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="w-full aspect-[4/3]" radius={12} delay={`${i * 60}ms`} />
          ))}
        </div>
      </main>
    </div>
  );
}

function AppShell() {
  const { isAuthenticated, isLoading } = useAuth();
  const { pathname } = useRoute();
  const isReporter = pathname === '/reporter';

  if (isLoading) {
    // On the reporter route, show its skeleton straight away so a shared
    // /reporter link lands on the page's shape instead of a spinner.
    return isReporter ? <ReporterSkeleton /> : <RouteSkeleton />;
  }

  // Anonymous visitors get the suite-standard blocking login modal, rendered
  // by the shared AuthProvider; the app sits behind a plain backdrop.
  if (!isAuthenticated) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-950" />;
  }

  if (isReporter) {
    return (
      <Suspense fallback={<ReporterSkeleton />}>
        <ReporterView />
      </Suspense>
    );
  }

  return <GalleryView />;
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </I18nProvider>
  );
}
