/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';

export default defineConfig({
  plugins: [
    react(),
    // plugin-react v6 transforms JSX with Oxc and no longer accepts a `babel`
    // option, so React Compiler runs as its own Babel pass.
    // target "18" is required because this app runs React 18 (the compiler
    // emits react-compiler-runtime calls that React 18 lacks natively).
    babel({ presets: [reactCompilerPreset({ target: '18' })] }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
