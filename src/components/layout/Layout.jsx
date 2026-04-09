// src/components/layout/Layout.jsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar  from './Navbar';
import { ThemeLanguageProvider } from '../../context/ThemeLanguageContext';

const COLLAPSED_KEY = 'np_sidebar_collapsed';

const LayoutInner = () => {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSED_KEY) === 'true'
  );

  const toggle = () => setCollapsed((c) => {
    localStorage.setItem(COLLAPSED_KEY, String(!c));
    return !c;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <Navbar  sidebarCollapsed={collapsed} onToggleSidebar={toggle} />
      <main className={`transition-all duration-300 pt-16 min-h-screen
        ${collapsed ? 'pl-16' : 'pl-60'}`}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// Wrap with ThemeLanguageProvider so all children get theme + lang context
const Layout = () => (
  <ThemeLanguageProvider>
    <LayoutInner />
  </ThemeLanguageProvider>
);

export default Layout;
