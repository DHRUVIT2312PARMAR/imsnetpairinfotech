// tailwind.config.js  — add to your project root
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


// ── index.css  (add these lines) ──────────────────────────────
/*
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'DM Sans', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  /* Smooth dark mode transitions */
  * {
    transition-property: background-color, border-color, color;
    transition-duration: 200ms;
    transition-timing-function: ease;
  }

  /* Custom scrollbar */
  .scrollbar-thin::-webkit-scrollbar       { width: 4px; }
  .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
  .scrollbar-thumb-gray-200::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 9999px; }
  .dark .scrollbar-thumb-gray-800::-webkit-scrollbar-thumb { background: #1f2937; }
}
*/
