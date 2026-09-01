import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GlassProvider, applyTheme, initOpenReplay, installSignalCarrier } from '@aireon/shared';
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

// showroom is dark-ONLY, not merely dark-first, so it does NOT resolve the
// cross-app theme. There is no toggle anywhere in the app, `:root` declares an
// unconditional `color-scheme: dark`, and `body` paints a fixed dark gradient
// over #08090b with no light branch. The five `dark:` utilities in the app are
// the whole of its light-mode story.
//
// It used to call `initTheme('dark')`, which HONOURS the suite cookie, so a
// visitor who had chosen light in any other *.aireon.ch app resolved to light
// here: the shared navbar, account menu and glass chrome rendered light on a
// canvas that is permanently dark. That never surfaced only because
// index.html hardcoded `class="dark"` and `resolveThemePreference()` checks the
// class BEFORE the stored choice, so the static tag masked it. Removing that
// tag (this PR) and @aireon/shared v1.205.2 (whose bootstrap now TOGGLES the
// class rather than only adding it) each expose it on their own.
//
// applyTheme is the non-persisting writer: it stamps all four root signals dark
// (THEME_STANDARD.md) without touching the `aireon_theme` cookie, so a visitor's
// light choice still travels to every other app. Giving showroom a real light
// palette is a product decision and is deliberately NOT made here; this only
// makes the code state what the app already is.
applyTheme('dark');

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
installSignalCarrier({ paths: ['/api/claire-pois'], endpoint: '/api/ctx' });

initOpenReplay({ projectKey: import.meta.env.VITE_OPENREPLAY_PROJECT_KEY as string | undefined, trackerOptions: { canvas: { disableCanvas: true } } });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlassProvider>
      <App />
    </GlassProvider>
  </StrictMode>
);
