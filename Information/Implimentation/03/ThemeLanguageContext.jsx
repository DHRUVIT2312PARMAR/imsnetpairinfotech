// src/context/ThemeLanguageContext.jsx
// ─────────────────────────────────────────────────────────────
//  MUST be placed in main.jsx wrapping EVERYTHING — not Layout.
//
//  main.jsx:
//    <ThemeLanguageProvider>
//      <AuthProvider>
//        <App />          ← App contains router, Layout, auth pages etc.
//      </AuthProvider>
//    </ThemeLanguageProvider>
// ─────────────────────────────────────────────────────────────
import React, {
  createContext, useContext, useState, useEffect, useCallback, useMemo,
} from 'react';
import { LANGUAGES, t as translate } from '../i18n';

const ThemeLanguageContext = createContext(null);

export const ThemeLanguageProvider = ({ children }) => {
  // ── Theme ─────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('np_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
    localStorage.setItem('np_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark((d) => !d), []);

  // ── Language ──────────────────────────────────────────────
  const [lang, setLangCode] = useState(
    () => localStorage.getItem('np_lang') || 'en'
  );

  const applyLang = useCallback((code) => {
    const found = LANGUAGES.find((l) => l.code === code);
    if (!found) return;
    setLangCode(code);
    localStorage.setItem('np_lang', code);
    document.documentElement.setAttribute('lang', code);
    document.documentElement.setAttribute('dir', found.rtl ? 'rtl' : 'ltr');
  }, []);

  // Apply on mount
  useEffect(() => {
    const found = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', found.rtl ? 'rtl' : 'ltr');
  }, []);

  // ── t() helper bound to current lang ─────────────────────
  const t = useCallback((key) => translate(lang, key), [lang]);

  const currentLang = useMemo(
    () => LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0],
    [lang]
  );

  const value = useMemo(() => ({
    isDark, toggleTheme,
    lang, setLang: applyLang, currentLang, LANGUAGES,
    t,
  }), [isDark, toggleTheme, lang, applyLang, currentLang, t]);

  return (
    <ThemeLanguageContext.Provider value={value}>
      {children}
    </ThemeLanguageContext.Provider>
  );
};

// ── Main hook — use anywhere in the entire app ────────────────
export const useThemeLang = () => {
  const ctx = useContext(ThemeLanguageContext);
  if (!ctx) throw new Error(
    'useThemeLang must be used inside <ThemeLanguageProvider>. ' +
    'Make sure ThemeLanguageProvider wraps your entire app in main.jsx.'
  );
  return ctx;
};

// ── Convenience alias so components can do: ──────────────────
//    const { t } = useTranslation();
export const useTranslation = useThemeLang;
