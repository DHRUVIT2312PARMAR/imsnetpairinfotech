// src/components/layout/Layout.jsx
// Provider is in main.jsx — Layout just renders the shell
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar  from './Navbar';

const COLLAPSED_KEY = 'np_sidebar_collapsed';

const Layout = () => {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSED_KEY) === 'true'
  );

  const toggle = () => setCollapsed((c) => {
    localStorage.setItem(COLLAPSED_KEY, String(!c));
    return !c;
  });

  return (
    // dark: classes on <html> propagate here automatically
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <Navbar  sidebarCollapsed={collapsed} />

      <main className={`transition-all duration-300 pt-16 min-h-screen
        ${collapsed ? 'pl-16' : 'pl-60'}`}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
