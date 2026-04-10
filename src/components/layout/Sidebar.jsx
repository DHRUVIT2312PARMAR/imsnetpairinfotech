// src/components/layout/Sidebar.jsx
import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getNavForRole, BADGE_ENDPOINTS } from '../../config/navConfig';

// Logo Component
const SidebarLogo = ({ collapsed }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`h-16 border-b border-gray-200 dark:border-gray-800 flex items-center ${collapsed ? 'justify-center px-3' : 'px-4 gap-3'}`}>
      {/* Logo container with fixed size */}
      <div className="w-8 h-8 flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center">
        {imgError ? (
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-xs">NP</span>
          </div>
        ) : (
          <img
            src="/logo1.png"
            alt="Netpair"
            className="w-8 h-8 object-contain"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      
      {/* Company name - hidden when collapsed */}
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">
            Netpair
          </p>
          <p className="text-[9px] font-bold text-orange-500 uppercase tracking-wider leading-tight">
            Infotech
          </p>
        </div>
      )}
    </div>
  );
};

// Nav Item Component
const NavItem = ({ item, collapsed, badge, depth = 0 }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const hasChildren = item.children?.length > 0;

  useEffect(() => {
    if (hasChildren && item.children.some((c) => location.pathname.startsWith(c.path))) {
      setOpen(true);
    }
  }, [location.pathname, hasChildren, item.children]);

  const isActive = hasChildren
    ? item.children.some((c) => location.pathname.startsWith(c.path))
    : location.pathname === item.path || location.pathname.startsWith(item.path + '/');

  const baseClasses = `
    group relative flex items-center gap-3 rounded-xl cursor-pointer select-none
    text-sm font-medium transition-all duration-150
    ${depth === 0 ? 'px-3 py-2.5 mx-2' : 'px-3 py-2 ml-7 mr-2'}
    ${isActive
      ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
    }
  `;

  const content = (
    <>
      {isActive && depth === 0 && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-orange-500" />
      )}
      
      <i className={`${item.icon} text-lg flex-shrink-0 ${isActive ? 'text-orange-500' : 'text-gray-400'}`} />
      
      {!collapsed && (
        <span className="flex-1 truncate">{item.label}</span>
      )}
      
      {!collapsed && badge > 0 && (
        <span className="min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      
      {collapsed && badge > 0 && (
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
      )}
      
      {!collapsed && hasChildren && (
        <i className={`ri-arrow-right-s-line text-sm transition-transform ${open ? 'rotate-90' : ''}`} />
      )}
      
      {collapsed && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
          {item.label}
          {badge > 0 && <span className="ml-1 text-red-400">({badge})</span>}
        </div>
      )}
    </>
  );

  if (hasChildren) {
    return (
      <div>
        <div className={baseClasses} onClick={() => !collapsed && setOpen(!open)}>
          {content}
        </div>
        {open && !collapsed && (
          <div className="space-y-0.5">
            {item.children.map((child) => (
              <NavItem key={child.key} item={child} collapsed={false} depth={1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink to={item.path} className={baseClasses}>
      {content}
    </NavLink>
  );
};

// Main Sidebar Component
const Sidebar = ({ collapsed, onToggle }) => {
  const { user } = useAuth();
  const [badges, setBadges] = useState({});
  const intervalRef = useRef(null);

  const navItems = getNavForRole(user?.role ?? 'employee');

  useEffect(() => {
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

    fetchBadges();
    intervalRef.current = setInterval(fetchBadges, 60000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen z-40
        bg-white dark:bg-gray-950
        border-r border-gray-200 dark:border-gray-800
        shadow-sm flex flex-col
        transition-all duration-300
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      <SidebarLogo collapsed={collapsed} />

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-5 w-6 h-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center shadow-md hover:shadow-lg z-50"
      >
        <i className={`ri-arrow-left-s-line text-xs text-gray-500 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5">
        {navItems.map((item) => (
          <div key={item.key}>
            {item.divider && (
              <div className={`my-2 border-t border-gray-200 dark:border-gray-800 ${collapsed ? 'mx-2' : 'mx-3'}`} />
            )}
            <NavItem
              item={item}
              collapsed={collapsed}
              badge={item.badge ? (badges[item.badge] ?? 0) : 0}
            />
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className={`border-t border-gray-200 dark:border-gray-800 ${collapsed ? 'p-2' : 'p-3'}`}>
        {collapsed ? (
          <img
            src={user?.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${user?.firstName} ${user?.lastName}`)}&background=f97316&color=fff&size=32`}
            alt={user?.firstName}
            className="w-9 h-9 rounded-full object-cover mx-auto ring-2 ring-orange-200"
          />
        ) : (
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-50 dark:bg-gray-900">
            <img
              src={user?.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${user?.firstName} ${user?.lastName}`)}&background=f97316&color=fff&size=32`}
              alt={user?.firstName}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-orange-100"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-orange-500 capitalize font-medium truncate">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
            <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
