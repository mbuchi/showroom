import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BugReportButton } from '@aireon/shared';
import App from './App.tsx';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@aireon/shared/map-ui.css';
import '@aireon/shared/scrollbars.css';
import './index.css';
import { errorLogger } from './lib/errorLog';

document.documentElement.classList.add('dark');

errorLogger.install();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <BugReportButton
      logger={errorLogger}
      metaData={{ rollout: 'bug-report-suite' }}
    />
  </StrictMode>
);
