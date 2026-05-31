import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { installErrorLogging } from '@swissnovo/shared';
import App from './App.tsx';
import './index.css';

document.documentElement.classList.add('dark');

installErrorLogging({ appName: 'showroom' });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
