// src/main.jsx
// ─────────────────────────────────────────────────────────────
//  ROOT ENTRY POINT
//  ThemeLanguageProvider is the OUTERMOST wrapper so every
//  component in the entire app — auth pages, layout, modals,
//  everything — can call useTranslation() and useThemeLang().
// ─────────────────────────────────────────────────────────────
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import { ThemeLanguageProvider } from './context/ThemeLanguageContext';
import { AuthProvider }           from './context/AuthContext';
import App                        from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ① ThemeLanguage — OUTERMOST: theme + lang available everywhere */}
    <ThemeLanguageProvider>
      {/* ② Auth — next layer */}
      <AuthProvider>
        {/* ③ Router */}
        <BrowserRouter>
          <App />
          {/* Toast uses same dark/light via CSS variables set on <html> */}
          <ToastContainer
            position="top-right"
            autoClose={3500}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            theme="colored"   // auto-picks light/dark based on prefers-color-scheme
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeLanguageProvider>
  </React.StrictMode>
);
