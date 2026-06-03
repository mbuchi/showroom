/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    // target "18" is required because this app runs React 18 (the compiler
    // emits react-compiler-runtime calls that React 18 lacks natively).
    react({ babel: { plugins: [['babel-plugin-react-compiler', { target: '18' }]] } }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
