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

  const sideW = collapsed ? 64 : 240;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-page)',
      position: 'relative',
    }}>
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <Navbar  sidebarCollapsed={collapsed} />

      {/* Content area — offset by sidebar + topbar */}
      <main style={{
        marginLeft: sideW,
        marginTop: 64,
        minHeight: 'calc(100vh - 64px)',
        transition: 'margin-left 300ms ease',
        background: 'var(--bg-page)',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ padding: 24 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
