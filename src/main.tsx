import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GlassProvider, initTheme, initOpenReplay } from '@aireon/shared';
import App from './App.tsx';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@aireon/shared/map-ui.css';
import '@aireon/shared/scrollbars.css';
import '@aireon/shared/glass.css';
import './index.css';
import { errorLogger } from './lib/errorLog';

// Resolve the cross-app/cross-device theme (cookie/localStorage → OS → app default).
// showroom is dark-first; initTheme preserves that default and applies the `.dark` class.
initTheme('dark');

errorLogger.install({ captureConsoleErrors: true });

initOpenReplay({ projectKey: import.meta.env.VITE_OPENREPLAY_PROJECT_KEY as string | undefined });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlassProvider>
      <App />
    </GlassProvider>
  </StrictMode>
);
