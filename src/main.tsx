import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GlassProvider, initTheme, initOpenReplay, installSignalCarrier } from '@aireon/shared';
import App from './App.tsx';
// Self-hosted Inter / JetBrains Mono / Varela Round. Replaces the render-blocking
// fonts.googleapis.com stylesheet this app used to load, and keeps the faces
// same-origin so html-to-image can read their cssRules on image export.
import '@aireon/shared/fonts.css';
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

// Carrier transport for usage signals. The signal client now queues events in
// memory and flushes them once on pagehide, instead of firing one
// POST /api/signal-collect per user action. Installed AFTER errorLogger.install
// so this wraps the outermost fetch rather than being wrapped by the error
// capture; that ordering is load-bearing.
//
// This is a transport change: the same data is collected and stored as before.
// It reduces how visible first-party analytics are in the Network tab; it is
// not a privacy or security measure. See aireon-shared/docs/SIGNAL_STANDARD.md.
installSignalCarrier({ endpoint: '/api/ctx' });

initOpenReplay({ projectKey: import.meta.env.VITE_OPENREPLAY_PROJECT_KEY as string | undefined, trackerOptions: { canvas: { disableCanvas: true } } });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlassProvider>
      <App />
    </GlassProvider>
  </StrictMode>
);
