import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import SignInGate from './components/SignInGate';
import GalleryView from './components/gallery/GalleryView';
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

  if (isLoading) {
    return <RouteSpinner />;
  }

  if (!isAuthenticated) {
    return <SignInGate />;
  }

  if (pathname === '/reporter') {
    return (
      <Suspense fallback={<RouteSpinner />}>
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
