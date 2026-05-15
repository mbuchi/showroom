import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import SignInGate from './components/SignInGate';
import GalleryView from './components/gallery/GalleryView';
import ReporterView from './components/reporter/ReporterView';
import { useRoute } from './lib/router';

function AppShell() {
  const { isAuthenticated, isLoading } = useAuth();
  const { pathname } = useRoute();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 size={22} className="animate-spin text-cyan-400" />
          <span className="text-xs uppercase tracking-[0.2em] font-semibold">Loading</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignInGate />;
  }

  if (pathname === '/reporter') {
    return <ReporterView />;
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
