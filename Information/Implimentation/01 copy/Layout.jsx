// src/components/layout/Layout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar  from './Navbar';

const COLLAPSED_KEY = 'sidebar_collapsed';

const Layout = () => {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSED_KEY) === 'true'
  );

  const toggle = () => setCollapsed((c) => {
    localStorage.setItem(COLLAPSED_KEY, String(!c));
    return !c;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <Navbar  sidebarCollapsed={collapsed} onToggleSidebar={toggle} />

      {/* Page content — offset matches sidebar + topbar */}
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
