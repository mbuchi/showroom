import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import GalleryView from './components/gallery/GalleryView';
import ReporterSkeleton from './components/reporter/ReporterSkeleton';
import { useRoute } from './lib/router';

// The reporter pulls in mapbox-gl + leaflet — lazy-loaded so the gallery page
// never downloads the map bundles.
const ReporterView = lazy(() => import('./components/reporter/ReporterView'));

function RouteSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <Loader2 size={22} className="animate-spin text-cyan-400" />
        <span className="text-xs uppercase tracking-[0.2em] font-semibold">Loading</span>
      </div>
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
    return isReporter ? <ReporterSkeleton /> : <RouteSpinner />;
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
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
