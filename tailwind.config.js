// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],

  // ── Dark mode: class strategy so we control it via JS ──────
  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          400: '#fb923c',
          500: '#f97316',  // primary orange
          600: '#ea580c',
          700: '#c2410c',
        },
      },
      animation: {
        'fade-in-down':  'fadeInDown 0.15s ease-out',
        'bounce-once':   'bounceOnce 0.4s ease-out',
      },
      keyframes: {
        fadeInDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceOnce: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':      { transform: 'scale(1.3)' },
        },
      },
    },
  },
  plugins: [],
};
