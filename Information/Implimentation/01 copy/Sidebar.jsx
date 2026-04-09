// src/components/layout/Sidebar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getNavForRole, BADGE_ENDPOINTS } from '../../config/navConfig';

// ─── Logo ────────────────────────────────────────────────────
const Logo = ({ collapsed }) => (
  <div className={`flex items-center gap-2 px-4 h-16 border-b border-gray-100 shrink-0 transition-all`}>
    <img src="/src/assets/imgs/Netpairlogo.png" alt="Netpair" className="w-8 h-8 object-contain shrink-0" />
    <span className={`font-bold text-gray-900 text-lg tracking-tight transition-all duration-200 overflow-hidden whitespace-nowrap
      ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
      Netpair
    </span>
  </div>
);

// ─── Nav Item ────────────────────────────────────────────────
const NavItem = ({ item, collapsed, badge, depth = 0 }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const hasChildren = item.children?.length > 0;

  // Auto-expand if a child is active
  useEffect(() => {
    if (hasChildren && item.children.some((c) => location.pathname.startsWith(c.path))) {
      setOpen(true);
    }
  }, [location.pathname]);

  const isActive = hasChildren
    ? item.children.some((c) => location.pathname.startsWith(c.path))
    : location.pathname === item.path || location.pathname.startsWith(item.path + '/');

  const baseClass = `
    group relative flex items-center gap-3 rounded-xl
    text-sm font-medium transition-all duration-150 cursor-pointer select-none
    ${depth === 0 ? 'px-3 py-2.5 mx-2' : 'px-3 py-2 ml-8 mr-2'}
    ${isActive
      ? 'bg-orange-50 text-orange-600'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
  `;

  const iconClass = `text-lg shrink-0 transition-colors
    ${isActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-700'}`;

  // Active left accent bar
  const accent = isActive && depth === 0
    ? 'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-1 before:rounded-r-full before:bg-orange-500'
    : '';

  const content = (
    <>
      {/* Active accent */}
      {isActive && depth === 0 && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-orange-500" />
      )}

      {/* Icon */}
      <i className={`${item.icon} ${iconClass}`} />

      {/* Label */}
      <span className={`flex-1 whitespace-nowrap overflow-hidden transition-all duration-200
        ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
        {item.label}
      </span>

      {/* Badge */}
      {!collapsed && badge > 0 && (
        <span className="min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}

      {/* Collapsed badge dot */}
      {collapsed && badge > 0 && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}

      {/* Chevron for parent items */}
      {!collapsed && hasChildren && (
        <i className={`ri-arrow-right-s-line text-gray-400 transition-transform duration-200
          ${open ? 'rotate-90' : ''}`} />
      )}

      {/* Tooltip when collapsed */}
      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50
          bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap
          opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150
          shadow-lg">
          {item.label}
          {badge > 0 && <span className="ml-1 text-red-400">({badge})</span>}
          <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
        </div>
      )}
    </>
  );

  if (hasChildren) {
    return (
      <div>
        <div className={`${baseClass} ${accent}`} onClick={() => !collapsed && setOpen((o) => !o)}>
          {content}
        </div>
        {/* Sub-menu */}
        <div className={`overflow-hidden transition-all duration-200 ${open && !collapsed ? 'max-h-96' : 'max-h-0'}`}>
          {item.children.map((child) => (
            <NavItem key={child.key} item={child} collapsed={false} depth={1} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <NavLink to={item.path} className={`${baseClass} ${accent}`}>
      {content}
    </NavLink>
  );
};

// ─── Sidebar ─────────────────────────────────────────────────
const Sidebar = ({ collapsed, onToggle }) => {
  const { user } = useAuth();
  const [badges, setBadges] = useState({});
  const intervalRef = useRef(null);

  const navItems = getNavForRole(user?.role ?? 'employee');

  // Fetch all badge counts
  const fetchBadges = async () => {
    const results = {};
    await Promise.allSettled(
      Object.entries(BADGE_ENDPOINTS).map(async ([key, url]) => {
        try {
          const { data } = await api.get(url);
          results[key] = data.count ?? 0;
        } catch {
          results[key] = 0;
        }
      })
    );
    setBadges(results);
  };

  useEffect(() => {
    fetchBadges();
    intervalRef.current = setInterval(fetchBadges, 60_000); // refresh every 60s
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-100 shadow-sm
        flex flex-col z-40 transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-60'}`}
    >
      <Logo collapsed={collapsed} />

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-5 w-6 h-6 bg-white border border-gray-200 rounded-full
          flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-50"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <i className={`ri-arrow-left-s-line text-xs text-gray-500 transition-transform duration-300
          ${collapsed ? 'rotate-180' : ''}`} />
      </button>

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5 scrollbar-thin scrollbar-thumb-gray-200">
        {navItems.map((item) => (
          <React.Fragment key={item.key}>
            {item.divider && (
              <div className={`mx-3 my-2 border-t border-gray-100 ${collapsed ? 'mx-2' : ''}`} />
            )}
            <NavItem
              item={item}
              collapsed={collapsed}
              badge={item.badge ? badges[item.badge] : 0}
            />
          </React.Fragment>
        ))}
      </nav>

      {/* Bottom: user mini card */}
      {!collapsed && (
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=f97316&color=fff&size=32`}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-400 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
