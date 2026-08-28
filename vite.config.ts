/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { aireonHtmlPlugin } from '@aireon/shared/vite';

export default defineConfig({
  plugins: [
    react(),
    // plugin-react v6 transforms JSX with Oxc and no longer accepts a `babel`
    // option, so React Compiler runs as its own Babel pass.
    // target "18" is required because this app runs React 18 (the compiler
    // emits react-compiler-runtime calls that React 18 lacks natively).
    babel({ presets: [reactCompilerPreset({ target: '18' })] }),
    // First-load standard (aireon-shared/docs/PERFORMANCE_STANDARD.md). Injects the
    // pre-paint theme bootstrap, the static app shell so something paints before any
    // JS runs, and preconnects for the origins the FIRST screen actually uses.
    //
    // archetype 'data-app', not 'map-first': showroom's entry route is the gallery,
    // which paints a navbar plus a grid of export tiles and fetches only
    // res.zeroo.ch/image/swissnovo. MapLibre and Leaflet live behind the lazy
    // /reporter route (see App.tsx), so preconnecting the swisstopo tile and search
    // hosts here would open two connections the first screen never uses. The toolbox
    // capability matrix agrees: showroom is mapFirst "no"; it only declares a
    // mapRenderer, which sets the performance BUDGET, not the archetype.
    //
    // defaultTheme MUST match main.tsx's initTheme('dark'): the bootstrap stamps
    // `data-theme` before paint and resolveThemePreference() then adopts that
    // attribute, so a mismatch here silently overrides the app's own default for
    // every visitor who has never chosen a theme.
    aireonHtmlPlugin({ archetype: 'data-app', defaultTheme: 'dark' }),
  ],
  optimizeDeps: {
    // @aireon/shared is excluded because Vite 8's rolldown dep pre-bundler
    // cannot resolve the `?worker&url` suffix on the MapLibre worker import
    // that lives inside the package, and dies with UNLOADABLE_DEPENDENCY
    // before serving a single request. optimizeDeps is dev-server only, so
    // this does not touch `npm run build`.
    exclude: ['lucide-react', '@aireon/shared'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
