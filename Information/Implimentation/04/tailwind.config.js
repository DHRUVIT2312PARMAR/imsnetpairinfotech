// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Brand ─────────────────────────────────────────────
        brand: {
          50:  '#FFF2EB',   // tinted bg, hover fills
          100: '#FDD9BF',   // light borders, badges
          200: '#FAB98A',   // mid tint
          400: '#F58B4C',   // secondary buttons
          500: '#F26B2E',   // PRIMARY — logo, buttons, accents ★
          600: '#C8521A',   // hover state
          700: '#9E3E10',   // active / pressed
          800: '#7A2E09',   // dark text on light bg
          900: '#521D04',   // darkest
        },

        // ── Neutral surfaces ──────────────────────────────────
        surface: {
          // Light mode surfaces
          'page':      '#F8F7F4',  // overall page bg
          'card':      '#FFFFFF',  // card / panel bg
          'sidebar':   '#FFFFFF',  // sidebar bg
          'input':     '#FFFFFF',  // input bg
          'divider':   '#F0EEE8',  // dividers, subtle borders
          // Dark mode surfaces (use with dark: prefix)
          'dark-page':    '#0F172A',  // overall page bg
          'dark-card':    '#1E293B',  // card / panel bg
          'dark-sidebar': '#111827',  // sidebar bg
          'dark-elevated':'#243044',  // modals, dropdowns
          'dark-input':   '#1E293B',  // input bg
          'dark-divider': '#1F2937',  // dividers
          'dark-border':  '#334155',  // card borders
        },

        // ── Semantic ──────────────────────────────────────────
        success: {
          50:  '#ECFDF5',
          100: '#D1FAE5',
          400: '#34D399',
          500: '#10B981',   // ★ default success
          600: '#059669',
          700: '#047857',
          light: '#10B981', // attend card
          dark:  '#059669', // attend card dark
        },
        warning: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          400: '#FBBF24',
          500: '#F59E0B',   // ★ default warning
          600: '#D97706',
          700: '#B45309',
        },
        danger: {
          50:  '#FEF2F2',
          100: '#FEE2E2',
          400: '#F87171',
          500: '#EF4444',   // ★ default danger
          600: '#DC2626',
          700: '#B91C1C',
        },
        info: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          400: '#60A5FA',
          500: '#3B82F6',   // ★ default info / total-employees card
          600: '#2563EB',
          700: '#1D4ED8',
        },

        // ── Accent palette (for charts, tags, categories) ─────
        violet: {
          50:  '#F5F3FF',
          100: '#EDE9FE',
          400: '#A78BFA',
          500: '#8B5CF6',   // ★ HR role, system-config card
          600: '#7C3AED',
        },
        teal: {
          50:  '#F0FDFA',
          100: '#CCFBF1',
          400: '#2DD4BF',
          500: '#14B8A6',   // ★ teal accent
          600: '#0D9488',
        },
        rose: {
          50:  '#FFF1F2',
          100: '#FFE4E6',
          400: '#FB7185',
          500: '#F43F5E',
        },

        // ── Role badge colors ─────────────────────────────────
        // Used in ROLE_PILL map — matches preview above
        role: {
          'sa-bg':    '#FEF2F2',   // super_admin light bg
          'sa-text':  '#B91C1C',   // super_admin light text
          'sa-border':'#FECACA',
          'ad-bg':    '#FFF2EB',   // admin light bg
          'ad-text':  '#C2410C',
          'ad-border':'#FDD9BF',
          'hr-bg':    '#F5F3FF',   // hr light bg
          'hr-text':  '#6D28D9',
          'hr-border':'#DDD6FE',
          'em-bg':    '#EFF6FF',   // employee light bg
          'em-text':  '#1D4ED8',
          'em-border':'#BFDBFE',
        },
      },

      // ── Semantic alias for quick access ──────────────────────
      backgroundColor: {
        'page':   'var(--bg-page)',
        'card':   'var(--bg-card)',
        'sidebar':'var(--bg-sidebar)',
      },

      borderColor: {
        DEFAULT: 'var(--border-default)',
        'subtle': 'var(--border-subtle)',
      },

      textColor: {
        'base':    'var(--text-primary)',
        'muted':   'var(--text-muted)',
        'faint':   'var(--text-faint)',
        'brand':   '#F26B2E',
        'brand-dark': '#C8521A',
      },

      animation: {
        'fade-down':   'fadeDown 150ms ease-out',
        'bounce-once': 'bounceOnce 400ms ease-out',
        'pulse-once':  'pulse 1s ease-in-out 1',
      },
      keyframes: {
        fadeDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceOnce: {
          '0%,100%': { transform: 'scale(1)' },
          '50%':     { transform: 'scale(1.25)' },
        },
      },
      boxShadow: {
        'card':  '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'panel': '0 4px 20px -2px rgba(0,0,0,0.08)',
        'none':  'none',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
