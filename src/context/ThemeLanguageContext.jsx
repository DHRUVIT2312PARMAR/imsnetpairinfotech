// src/context/ThemeLanguageContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LANGUAGES } from '../config/i18n';

const ThemeLanguageContext = createContext(null);

export const ThemeLanguageProvider = ({ children }) => {
  // ── Theme ──────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('np_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem('np_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark((d) => !d), []);

  // ── Language ───────────────────────────────────────────────
  const [lang, setLangState] = useState(
    () => localStorage.getItem('np_lang') || 'en'
  );

  const setLang = useCallback((code) => {
    const found = LANGUAGES.find((l) => l.code === code);
    if (!found) return;
    setLangState(code);
    localStorage.setItem('np_lang', code);
    // RTL support
    document.documentElement.setAttribute('dir', found.rtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', code);
  }, []);

  // Apply RTL on mount
  useEffect(() => {
    const found = LANGUAGES.find((l) => l.code === lang);
    document.documentElement.setAttribute('dir', found?.rtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const currentLang = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <ThemeLanguageContext.Provider value={{ isDark, toggleTheme, lang, setLang, currentLang, LANGUAGES }}>
      {children}
    </ThemeLanguageContext.Provider>
  );
};

export const useThemeLang = () => {
  const ctx = useContext(ThemeLanguageContext);
  if (!ctx) throw new Error('useThemeLang must be used inside ThemeLanguageProvider');
  return ctx;
};
