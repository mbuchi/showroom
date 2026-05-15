/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './node_modules/@swissnovo/shared/dist/**/*.js'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        varela: ['"Varela Round"', 'sans-serif'],
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
