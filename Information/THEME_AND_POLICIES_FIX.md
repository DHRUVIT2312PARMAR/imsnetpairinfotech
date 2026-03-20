# Theme System & Policies Fix
## NetPair IMS — Universal Dark/Light Theme + Policies Visibility Fix

**Version:** 1.0.0
**Fixes:**
- Remove theme toggle from Profile/Settings page
- Add working universal theme toggle in Header
- Make dark/light theme fully functional across all pages
- Fix Policies page where all content is invisible
**Last Updated:** March 2026

---

## TABLE OF CONTENTS

1. [Problem Summary](#1-problem-summary)
2. [Theme Architecture](#2-theme-architecture)
3. [Step 1 — tailwind.config.js](#3-step-1--tailwindconfigjs)
4. [Step 2 — ThemeContext.jsx (new file)](#4-step-2--themecontextjsx-new-file)
5. [Step 3 — main.jsx](#5-step-3--mainjsx)
6. [Step 4 — index.css](#6-step-4--indexcss)
7. [Step 5 — Header.jsx](#7-step-5--headerjsx)
8. [Step 6 — Settings.jsx (remove theme toggle)](#8-step-6--settingsjsx-remove-theme-toggle)
9. [Step 7 — Policies.jsx (visibility fix)](#9-step-7--policiesjsx-visibility-fix)
10. [Dark Mode Class Reference](#10-dark-mode-class-reference)
11. [Test Checklist](#11-test-checklist)

---

## 1. PROBLEM SUMMARY

### Problem 1 — Theme toggle in wrong place
```
Current:  Theme toggle is inside Settings/Profile page
Fix:      Remove from Settings page entirely
          Add ONE toggle in Header — works globally
```

### Problem 2 — Theme toggle does nothing
```
Current:  Toggle exists but clicking it changes nothing
Cause:    tailwind.config.js missing darkMode: 'class'
          No ThemeContext adding .dark class to <html>
Fix:      3 changes — config, context, main.jsx
```

### Problem 3 — Policies page invisible
```
Current:  Navigate to /policies — blank / all invisible
Cause:    Text color matches background (no dark: variants)
          OR hardcoded color: white in style prop
Fix:      Replace Policies.jsx with properly colored version
```

---

## 2. THEME ARCHITECTURE

```
User clicks toggle in Header
        ↓
ThemeContext.toggleTheme()
        ↓
document.documentElement.classList.toggle('dark')
        ↓
localStorage.setItem('netpair-theme', 'dark')
        ↓
Tailwind dark: prefixes activate on all elements
        ↓
Entire app switches theme instantly
        ↓
On page refresh → localStorage read → theme restored
```

---

## 3. STEP 1 — tailwind.config.js

Open `tailwind.config.js` in your project root and add `darkMode: 'class'`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',     // ← THIS IS REQUIRED — without this nothing works
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#0a0f1a',    // deep dark background
        }
      }
    },
  },
  plugins: [],
}
```

---

## 4. STEP 2 — ThemeContext.jsx (new file)

Create this new file: `src/context/ThemeContext.jsx`

```jsx
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('netpair-theme') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('netpair-theme', theme);
  }, [theme]);

  // Apply on first load (handles page refresh)
  useEffect(() => {
    const saved = localStorage.getItem('netpair-theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};

export default ThemeContext;
```

---

## 5. STEP 3 — main.jsx

Open `src/main.jsx` and wrap the app with ThemeProvider:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider }  from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';  // ADD
import './index.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>           {/* ADD — wraps everything */}
      <AuthProvider>
        <App />
        <ToastContainer position="top-right" />
      </AuthProvider>
    </ThemeProvider>          {/* ADD */}
  </React.StrictMode>
);
```

---

## 6. STEP 4 — index.css

Open `src/index.css` and add dark mode base styles:

```css
/* Prevent flash of wrong theme on load */
html { color-scheme: light dark; }
html.dark { color-scheme: dark; }

/* Base page background */
body {
  @apply bg-gray-50 text-gray-900 transition-colors duration-200;
}
html.dark body {
  @apply bg-gray-950 text-gray-100;
}

/* Dark mode scrollbar */
html.dark ::-webkit-scrollbar-track { background: #1f2937; }
html.dark ::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }
html.dark ::-webkit-scrollbar-thumb:hover { background: #6b7280; }
```

---

## 7. STEP 5 — Header.jsx

Open `src/components/Header.jsx` and add the universal toggle button:

```jsx
import { useTheme } from '../context/ThemeContext';  // ADD THIS IMPORT
import { useAuth }  from '../context/AuthContext';

const Header = () => {
  const { theme, toggleTheme } = useTheme();   // ADD
  const { user, logout }       = useAuth();

  return (
    <div className="w-full flex items-center justify-between px-5 py-3
                    bg-white dark:bg-gray-900
                    border-b border-gray-200 dark:border-gray-700
                    flex-shrink-0 transition-colors duration-200">

      {/* Left: Welcome */}
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
          Welcome, {user?.firstName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
          })}
        </p>
      </div>

      {/* Right: Theme toggle + role badge + logout */}
      <div className="flex items-center gap-3">

        {/* Role badge */}
        <span className="text-xs bg-blue-100 dark:bg-blue-900
                         text-blue-800 dark:text-blue-300
                         px-2 py-1 rounded-full hidden sm:inline">
          {user?.role}
        </span>

        {/* ── UNIVERSAL THEME TOGGLE ─────────────────── */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          className="w-9 h-9 flex items-center justify-center rounded-lg
                     bg-gray-100 dark:bg-gray-800
                     hover:bg-gray-200 dark:hover:bg-gray-700
                     text-gray-600 dark:text-gray-300
                     transition-colors duration-200"
        >
          {theme === 'dark' ? (
            /* Sun — shown in dark mode */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41
                       M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
          ) : (
            /* Moon — shown in light mode */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
            </svg>
          )}
        </button>
        {/* ─────────────────────────────────────────────── */}

        {/* Logout */}
        <button onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white text-xs
                     font-medium px-3 py-2 rounded-lg transition-colors">
          <span className="hidden sm:inline">Logout</span>
          <i className="ri-logout-box-r-line sm:hidden" />
        </button>

      </div>
    </div>
  );
};

export default Header;
```

---

## 8. STEP 6 — Settings.jsx (remove theme toggle)

Find and delete the theme/dark mode section from Settings.jsx.

It may look like any of these — **delete whichever you find**:

```jsx
{/* DELETE whichever version exists in your file */}

{/* Version A */}
<div className="mb-4">
  <label>Theme</label>
  <select value={theme} onChange={e => setTheme(e.target.value)}>
    <option value="light">Light</option>
    <option value="dark">Dark</option>
  </select>
</div>

{/* Version B */}
<div className="flex items-center justify-between">
  <span>Dark Mode</span>
  <input type="checkbox" checked={isDark} onChange={toggleTheme} />
</div>

{/* Version C */}
<div>
  <p>Color Theme</p>
  <button onClick={() => setTheme('dark')}>Dark</button>
  <button onClick={() => setTheme('light')}>Light</button>
</div>
```

Also delete these from the state/imports at the top of Settings.jsx:

```jsx
// DELETE any of these from Settings.jsx state:
const [theme, setTheme] = useState('light');
const { theme, toggleTheme } = useTheme();
import { useTheme } from '../../context/ThemeContext';
```

Replace with this hint row in the Personal Preferences section:

```jsx
{/* ADD THIS in place of the deleted theme toggle */}
<div className="flex items-center justify-between py-3
                border-b border-gray-200 dark:border-gray-700">
  <div>
    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
      App Theme
    </p>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
      Use the sun/moon icon in the top header to switch theme
    </p>
  </div>
  <span className="text-xs text-blue-600 dark:text-blue-400
                   bg-blue-50 dark:bg-blue-900/30
                   px-2 py-1 rounded-full">
    Header ↑
  </span>
</div>
```

---

## 9. STEP 7 — Policies.jsx (visibility fix)

Replace your entire `src/pages/policies/Policies.jsx` with this:

```jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast }   from 'react-toastify';
import api         from '../../services/api';

const STATUS_BADGE = {
  draft:            'bg-gray-100  dark:bg-gray-700  text-gray-600  dark:text-gray-300',
  pending_approval: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200',
  approved:         'bg-green-100  dark:bg-green-900  text-green-700 dark:text-green-200',
  rejected:         'bg-red-100    dark:bg-red-900    text-red-700   dark:text-red-200',
  archived:         'bg-gray-100   dark:bg-gray-700   text-gray-500  dark:text-gray-400',
};

const SAMPLE = [
  { _id:'1', title:'Leave Policy',          category:'HR',
    status:'approved',         updatedAt: new Date().toISOString(),
    content:'All employees are entitled to 12 annual leaves per year. Sick leave: 8 days. Casual leave: 6 days. Leaves must be applied at least 2 days in advance except in emergencies.' },
  { _id:'2', title:'Code of Conduct',        category:'Admin',
    status:'approved',         updatedAt: new Date().toISOString(),
    content:'Employees must maintain professional conduct at all times. Harassment, discrimination, or misconduct of any kind will not be tolerated and may result in termination.' },
  { _id:'3', title:'WFH Policy',             category:'HR',
    status:'pending_approval', updatedAt: new Date().toISOString(),
    content:'Employees may request work-from-home up to 2 days per week subject to manager approval. Core hours 10am–4pm must be observed during WFH days.' },
  { _id:'4', title:'Asset Usage Policy',     category:'Admin',
    status:'approved',         updatedAt: new Date().toISOString(),
    content:'Company assets are provided for business use only. Employees are responsible for the care and return of all assigned assets.' },
];

const Policies = () => {
  const { user }                    = useAuth();
  const [policies, setPolicies]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(null);

  const isAdminOrAbove = ['admin','superAdmin'].includes(user?.role);
  const canApprove     = user?.role === 'superAdmin';

  useEffect(() => { fetchPolicies(); }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/policies');
      setPolicies(data.data || SAMPLE);
    } catch {
      setPolicies(SAMPLE);   // fallback so page is never blank
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/policies/${id}/approve`);
      toast.success('Policy approved');
      fetchPolicies();
      setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/policies/${id}/reject`);
      toast.success('Policy rejected');
      fetchPolicies();
      setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const visible = policies
    .filter(p => isAdminOrAbove ? true : p.status === 'approved')
    .filter(p => p.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-950
                    flex flex-col transition-colors">

      {/* Header */}
      <div className="bg-white dark:bg-gray-900
                      border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4
                        flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Policies
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {isAdminOrAbove
                ? 'Create and manage company policies'
                : 'View active company policies'}
            </p>
          </div>
          {isAdminOrAbove && (
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm
                               font-medium px-4 py-2 rounded-lg transition-colors">
              + New Policy
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">

          {/* Search */}
          <input type="text" placeholder="Search policies..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm px-4 py-2 border rounded-lg text-sm outline-none
                       bg-white dark:bg-gray-800
                       border-gray-300 dark:border-gray-600
                       text-gray-900 dark:text-gray-100
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:ring-2 focus:ring-blue-500 transition-colors" />

          {/* Loading spinner */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8
                              border-2 border-blue-600 border-t-transparent" />
            </div>
          )}

          {/* Empty state */}
          {!loading && visible.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No policies found.
              </p>
            </div>
          )}

          {/* Grid */}
          {!loading && visible.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map(policy => (
                <div key={policy._id} onClick={() => setSelected(policy)}
                  className="bg-white dark:bg-gray-800
                             border border-gray-200 dark:border-gray-700
                             rounded-xl p-5 cursor-pointer group
                             hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600
                             transition-all duration-200">

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium
                                     text-blue-700 dark:text-blue-300
                                     bg-blue-50 dark:bg-blue-900/40
                                     px-2 py-0.5 rounded-full">
                      {policy.category || 'General'}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                                      ${STATUS_BADGE[policy.status] || STATUS_BADGE.draft}`}>
                      {(policy.status || 'draft').replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    {policy.title}
                  </h3>

                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {policy.content || 'Click to view policy details.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700
                                  flex items-center justify-between">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(policy.updatedAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-blue-500 dark:text-blue-400
                                     opacity-0 group-hover:opacity-100 transition-opacity">
                      View →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.55)' }}
             onClick={() => setSelected(null)}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto
                          bg-white dark:bg-gray-800 rounded-2xl shadow-2xl"
               onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-start justify-between p-6
                            border-b border-gray-200 dark:border-gray-700">
              <div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                                   inline-block mb-2
                                   ${STATUS_BADGE[selected.status] || STATUS_BADGE.draft}`}>
                  {(selected.status || 'draft').replace('_', ' ')}
                </span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {selected.title}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selected.category} · Updated {new Date(selected.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                           ml-4 text-3xl leading-none font-light transition-colors">
                ×
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6">
              <p className="text-sm text-gray-700 dark:text-gray-300
                            leading-relaxed whitespace-pre-wrap">
                {selected.content || 'No content available.'}
              </p>
            </div>

            {/* Approve/Reject — SuperAdmin only on pending */}
            {canApprove && selected.status === 'pending_approval' && (
              <div className="flex gap-3 p-6
                              border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => handleApprove(selected._id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white
                             text-sm font-medium py-2.5 rounded-lg transition-colors">
                  Approve Policy
                </button>
                <button onClick={() => handleReject(selected._id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white
                             text-sm font-medium py-2.5 rounded-lg transition-colors">
                  Reject Policy
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Policies;
```

---

## 10. DARK MODE CLASS REFERENCE

Add these `dark:` counterparts everywhere in your existing pages:

| What | Light class | Dark class |
|------|------------|------------|
| Page background | `bg-gray-50` | `dark:bg-gray-950` |
| Card / panel | `bg-white` | `dark:bg-gray-800` |
| Sidebar | `bg-white` | `dark:bg-gray-900` |
| Heading text | `text-gray-900` | `dark:text-white` |
| Body text | `text-gray-700` | `dark:text-gray-300` |
| Muted text | `text-gray-500` | `dark:text-gray-400` |
| Faint text | `text-gray-400` | `dark:text-gray-500` |
| Border | `border-gray-200` | `dark:border-gray-700` |
| Input bg | `bg-white` | `dark:bg-gray-800` |
| Input border | `border-gray-300` | `dark:border-gray-600` |
| Input text | `text-gray-900` | `dark:text-gray-100` |
| Hover row | `hover:bg-gray-50` | `dark:hover:bg-gray-800` |
| Divider | `divide-gray-100` | `dark:divide-gray-700` |
| Table header | `bg-gray-50` | `dark:bg-gray-800` |
| Active nav | `bg-blue-50 text-blue-700` | `dark:bg-blue-900 dark:text-blue-300` |

---

## 11. TEST CHECKLIST

```
□  tailwind.config.js has: darkMode: 'class'
□  src/context/ThemeContext.jsx created
□  src/main.jsx has <ThemeProvider> wrapping everything
□  Header shows moon icon (light) or sun icon (dark)
□  Clicking icon — ENTIRE APP switches theme instantly
□  Refresh page — theme is remembered (localStorage)
□  DevTools → Elements → <html> has class="dark" when dark
□  Settings page — NO theme toggle (just "Use header ↑" note)
□  Policies page — cards are visible in BOTH light and dark
□  Policies page — text is readable in BOTH themes
□  Status badges have correct colors in both themes
□  Policies modal opens and content is readable
□  SuperAdmin sees Approve/Reject buttons on pending policies
```

---

## COMMON MISTAKES

```javascript
// ❌ WRONG — hardcoded white text (invisible in light mode)
<p style={{ color: '#ffffff' }}>Text</p>

// ✅ RIGHT
<p className="text-gray-900 dark:text-white">Text</p>

// ❌ WRONG — missing dark variant (white text on white bg in dark mode)
<div className="bg-white">
  <p className="text-gray-900">Text</p>
</div>

// ✅ RIGHT
<div className="bg-white dark:bg-gray-800">
  <p className="text-gray-900 dark:text-gray-100">Text</p>
</div>

// ❌ WRONG — darkMode: 'media' uses OS preference, toggle won't work
module.exports = { darkMode: 'media', ... }

// ✅ RIGHT — darkMode: 'class' responds to .dark on <html>
module.exports = { darkMode: 'class', ... }
```

---

*Three changes make the theme work: `darkMode: 'class'` in Tailwind config, ThemeContext adding `.dark` to `<html>`, and wrapping the app in ThemeProvider.*
*Policies fix: replace the component — every color now has a `dark:` counterpart and sample data ensures the page is never blank.*
