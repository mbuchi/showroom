/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './node_modules/@aireon/shared/dist/**/*.js'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Suite typography tokens — mirror :root --hood-{font,display,mono}.
        // sans (Inter) is UI body/headings/controls. display (Varela Round) is
        // reserved for the brand wordmark only. mono (JetBrains Mono) is for
        // IDs, EGRID, and code surfaces.
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['"Varela Round"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', '"Cascadia Code"', 'Consolas', 'monospace'],
        // Back-compat alias — older components still use `font-varela`.
        varela: ['"Varela Round"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#08090b',
          900: '#0b0d10',
          850: '#101216',
          800: '#15181d',
          750: '#1b1f26',
          700: '#23272f',
          600: '#2e3340',
        },
      },
      boxShadow: {
        'card': '0 1px 0 rgba(255,255,255,0.04) inset, 0 1px 2px rgba(0,0,0,0.4)',
        'card-hover': '0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 30px rgba(0,0,0,0.5)',
        'glow-cyan': '0 0 0 1px rgba(34,211,238,0.25), 0 8px 30px rgba(34,211,238,0.15)',
      },
    },
  },
  plugins: [],
};
