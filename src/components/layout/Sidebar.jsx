// src/components/layout/Sidebar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeLang } from '../../context/ThemeLanguageContext';
import api from '../../services/api';
import { getNavForRole, BADGE_ENDPOINTS } from '../../config/navConfig';

// ─── Logo — completely self-contained, never bleeds outside ──
const SidebarLogo = ({ collapsed }) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    // Outer: fixed height, never grows, clips overflow
    <div
      style={{
        height: 64,
        minHeight: 64,
        maxHeight: 64,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : 10,
        padding: collapsed ? '0 12px' : '0 16px',
        borderBottom: '1px solid var(--border-default)',
        flexShrink: 0,
      }}
    >
      {/* Logo mark — hard 32×32, never larger */}
      <div
        style={{
          width: 32,
          minWidth: 32,
          maxWidth: 32,
          height: 32,
          minHeight: 32,
          maxHeight: 32,
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: imgFailed ? '#F26B2E' : 'transparent',
          flexShrink: 0,
        }}
      >
        {imgFailed ? (
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 11, letterSpacing: -1 }}>NP</span>
        ) : (
          <img
            src="/logo1.png"
            alt="Netpair"
            onError={() => setImgFailed(true)}
            style={{
              width: 32,
              height: 32,
              objectFit: 'contain',
              display: 'block',
            }}
          />
        )}
      </div>

      {/* Company name — hidden when collapsed */}
      <div
        style={{
          overflow: 'hidden',
          width: collapsed ? 0 : 'auto',
          opacity: collapsed ? 0 : 1,
          transition: 'width 200ms ease, opacity 200ms ease',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.2, margin: 0 }}>
          Netpair
        </p>
        <p style={{ fontSize: 8, fontWeight: 700, color: '#F26B2E', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
          Infotech
        </p>
      </div>
    </div>
  );
};

// ─── Single nav item ──────────────────────────────────────────
const NavItem = ({ item, collapsed, badge, depth = 0 }) => {
  const location   = useLocation();
  const [open, setOpen] = useState(false);
  const hasChildren = item.children?.length > 0;

  // Auto-expand active child
  useEffect(() => {
    if (hasChildren && item.children.some((c) => location.pathname.startsWith(c.path)))
      setOpen(true);
  }, [location.pathname, hasChildren, item.children]);

  const isActive = hasChildren
    ? item.children.some((c) => location.pathname.startsWith(c.path))
    : location.pathname === item.path || location.pathname.startsWith(item.path + '/');

  const baseClass = `
    group relative flex items-center gap-3 rounded-xl cursor-pointer select-none
    text-sm font-medium transition-all duration-150
    ${depth === 0 ? 'px-3 py-2.5 mx-2' : 'px-3 py-2 ml-7 mr-2'}
    ${isActive
      ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
    }
  `;

  const iconClass = `text-[18px] shrink-0 transition-colors leading-none
    ${isActive ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`;

  const inner = (
    <>
      {/* Active accent bar */}
      {isActive && depth === 0 && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-orange-500" />
      )}

      <i className={`${item.icon} ${iconClass}`} />

      <span className={`flex-1 whitespace-nowrap overflow-hidden transition-all duration-200
        ${collapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-auto opacity-100'}`}>
        {item.label}
      </span>

      {/* Badge pill */}
      {!collapsed && badge > 0 && (
        <span className="min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold
          rounded-full flex items-center justify-center leading-none">
          {badge > 99 ? '99+' : badge}
        </span>
      )}

      {/* Collapsed badge dot */}
      {collapsed && badge > 0 && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
      )}

      {/* Chevron */}
      {!collapsed && hasChildren && (
        <i className={`ri-arrow-right-s-line text-gray-400 transition-transform duration-200
          ${open ? 'rotate-90' : ''}`} />
      )}

      {/* Tooltip (only when collapsed) */}
      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 pointer-events-none
          bg-gray-900 dark:bg-gray-700 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap
          opacity-0 group-hover:opacity-100 transition-opacity duration-100 shadow-xl">
          {item.label}
          {badge > 0 && <span className="ml-1 text-red-400">({badge})</span>}
          <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900 dark:border-r-gray-700" />
        </div>
      )}
    </>
  );

  if (hasChildren) {
    return (
      <div>
        <div className={baseClass} onClick={() => !collapsed && setOpen((o) => !o)}>
          {inner}
        </div>
        <div className={`overflow-hidden transition-all duration-200
          ${open && !collapsed ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
          {item.children.map((child) => (
            <NavItem key={child.key} item={child} collapsed={false} depth={1} />
          ))}
        </div>
      </div>
    );
  }

  return <NavLink to={item.path} className={baseClass}>{inner}</NavLink>;
};

// ─── Main Sidebar ─────────────────────────────────────────────
const Sidebar = ({ collapsed, onToggle }) => {
  const { user }  = useAuth();
  const [badges, setBadges] = useState({});
  const intervalRef = useRef(null);

  const navItems = getNavForRole(user?.role ?? 'employee');

  const fetchBadges = async () => {
    const results = {};
    await Promise.allSettled(
      Object.entries(BADGE_ENDPOINTS).map(async ([key, url]) => {
        try {
          const { data } = await api.get(url);
          results[key] = data.count ?? 0;
        } catch { results[key] = 0; }
      })
    );
    setBadges(results);
  };

  useEffect(() => {
    fetchBadges();
    intervalRef.current = setInterval(fetchBadges, 60_000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <aside className={`
      fixed left-0 top-0 h-screen z-40
      bg-white dark:bg-gray-950
      border-r border-gray-100 dark:border-gray-800
      shadow-sm flex flex-col transition-all duration-300 ease-in-out
      ${collapsed ? 'w-16' : 'w-60'}
    `} style={{ overflow: 'hidden' }}>
      <SidebarLogo collapsed={collapsed} />

      {/* Collapse toggle bubble */}
      <button onClick={onToggle}
        className="absolute -right-3 top-[26px] w-6 h-6 z-50
          bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
          rounded-full flex items-center justify-center shadow-md
          hover:shadow-lg hover:border-orange-300 transition-all">
        <i className={`ri-arrow-left-s-line text-[11px] text-gray-500 dark:text-gray-400
          transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
      </button>

      {/* Nav list */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5
        scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
        {navItems.map((item) => (
          <React.Fragment key={item.key}>
            {item.divider && (
              <div className={`my-2 border-t border-gray-100 dark:border-gray-800
                ${collapsed ? 'mx-2' : 'mx-3'}`} />
            )}
            <NavItem
              item={item}
              collapsed={collapsed}
              badge={item.badge ? (badges[item.badge] ?? 0) : 0}
            />
          </React.Fragment>
        ))}
      </nav>

      {/* Bottom user card */}
      <div className={`border-t border-gray-100 dark:border-gray-800 transition-all
        ${collapsed ? 'p-2' : 'p-3'}`}>
        {collapsed ? (
          <img
            src={user?.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${user?.firstName} ${user?.lastName}` ?? 'U')}&background=f97316&color=fff&size=32&bold=true`}
            alt={`${user?.firstName} ${user?.lastName}`}
            className="w-9 h-9 rounded-full object-cover mx-auto ring-2 ring-orange-200"
          />
        ) : (
          <div className="flex items-center gap-2.5 p-2 rounded-xl
            bg-gray-50 dark:bg-gray-900">
            <img
              src={user?.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${user?.firstName} ${user?.lastName}` ?? 'U')}&background=f97316&color=fff&size=32&bold=true`}
              alt={`${user?.firstName} ${user?.lastName}`}
              className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-orange-100"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-orange-500 capitalize font-medium truncate">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
            <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
