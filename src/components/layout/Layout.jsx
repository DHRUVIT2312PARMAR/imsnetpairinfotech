// src/components/layout/Layout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const COLLAPSED_KEY = 'np_sidebar_collapsed';

const Layout = () => {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSED_KEY) === 'true'
  );

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(newValue));
      return newValue;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar - Fixed left */}
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
      
      {/* Navbar - Fixed top, offset by sidebar */}
      <Navbar sidebarCollapsed={collapsed} />
      
      {/* Main content - Offset by both sidebar and navbar */}
      <main 
        className={`
          min-h-screen
          pt-16
          transition-all duration-300
          ${collapsed ? 'ml-16' : 'ml-60'}
        `}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
