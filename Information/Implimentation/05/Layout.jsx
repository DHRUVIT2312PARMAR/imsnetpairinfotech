// src/components/layout/Layout.jsx
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

  const sideW = collapsed ? 64 : 240;

  return (
    // overflow:hidden on root so nothing bleeds out
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', overflow: 'hidden' }}>
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <Navbar  sidebarCollapsed={collapsed} />

      {/* Content area — offset by sidebar + topbar */}
      <main style={{
        marginLeft: sideW,
        paddingTop: 64,
        minHeight: '100vh',
        transition: 'margin-left 300ms ease',
        background: 'var(--bg-page)',
      }}>
        <div style={{ padding: 24 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
