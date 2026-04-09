// src/components/layout/Sidebar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeLang } from '../../context/ThemeLanguageContext';
import api from '../../services/api';
import { getNavForRole, BADGE_ENDPOINTS } from '../../config/navConfig';

const SidebarLogo = ({ collapsed }) => (
  <div className={`flex items-center h-16 border-b border-gray-100 dark:border-gray-800 shrink-0
    transition-all ${collapsed ? 'px-3 justify-center' : 'px-4 gap-2.5'}`}>
    <div className="w-9 h-9 rounded-xl shrink-0 overflow-hidden flex items-center justify-center
      bg-gradient-to-br from-orange-400 to-amber-500 shadow-sm">
      <img src="/src/assets/imgs/Netpairlogo.png" alt="NP" className="w-8 h-8 object-contain"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.parentElement.innerHTML =
            `<span style="font-weight:900;font-size:12px;color:white;letter-spacing:-1px">NP</span>`;
        }} />
    </div>
    <div className={`overflow-hidden transition-all duration-200 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
      <p className="text-sm font-black text-gray-900 dark:text-white leading-tight tracking-tight whitespace-nowrap">
        Netpair
      </p>
      <p className="text-[9px] font-bold text-orange-500 leading-tight tracking-[0.15em] uppercase whitespace-nowrap">
        Infotech
      </p>
    </div>
  </div>
);

const NavItem = ({ item, collapsed, badge, depth = 0 }) => {
  const location = useLocation();
  const { t } = useThemeLang();
  const [open, setOpen] = useState(false);
  const hasChildren = item.children?.length > 0;

  // translated label: try 'nav.{key}' key, fall back to item.label
  const label = t(`nav.${item.key}`) !== `nav.${item.key}` ? t(`nav.${item.key}`) : item.label;

  useEffect(() => {
    if (hasChildren && item.children.some((c) => location.pathname.startsWith(c.path)))
      setOpen(true);
  }, [location.pathname]);

  const isActive = hasChildren
    ? item.children.some((c) => location.pathname.startsWith(c.path))
    : location.pathname === item.path || location.pathname.startsWith(item.path + '/');

  const base = `group relative flex items-center gap-3 rounded-xl cursor-pointer select-none
    text-sm font-medium transition-all duration-150
    ${depth === 0 ? 'px-3 py-2.5 mx-2' : 'px-3 py-2 ml-7 mr-2'}
    ${isActive
      ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
    }`;

  const iconCls = `text-[18px] shrink-0 leading-none
    ${isActive ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`;

  const inner = (
    <>
      {isActive && depth === 0 && (
        <span className="absolute ltr:left-0 rtl:right-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-orange-500" />
      )}
      <i className={`${item.icon} ${iconCls}`} />
      <span className={`flex-1 whitespace-nowrap overflow-hidden transition-all duration-200
        ${collapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-auto opacity-100'}`}>
        {label}
      </span>
      {!collapsed && badge > 0 && (
        <span className="min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {collapsed && badge > 0 && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
      )}
      {!collapsed && hasChildren && (
        <i className={`ri-arrow-right-s-line text-gray-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      )}
      {collapsed && (
        <div className="absolute ltr:left-full rtl:right-full top-1/2 -translate-y-1/2 ltr:ml-3 rtl:mr-3 z-50 pointer-events-none
          bg-gray-900 dark:bg-gray-700 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl
          opacity-0 group-hover:opacity-100 transition-opacity duration-100">
          {label}
          {badge > 0 && <span className="ml-1 text-red-400">({badge})</span>}
        </div>
      )}
    </>
  );

  if (hasChildren) return (
    <div>
      <div className={base} onClick={() => !collapsed && setOpen((o) => !o)}>{inner}</div>
      <div className={`overflow-hidden transition-all duration-200 ${open && !collapsed ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
        {item.children.map((c) => <NavItem key={c.key} item={c} collapsed={false} depth={1} />)}
      </div>
    </div>
  );

  return <NavLink to={item.path} className={base}>{inner}</NavLink>;
};

const Sidebar = ({ collapsed, onToggle }) => {
  const { user } = useAuth();
  const [badges, setBadges] = useState({});
  const ref = useRef(null);
  const navItems = getNavForRole(user?.role ?? 'employee');

  useEffect(() => {
    const fetch = async () => {
      const res = {};
      await Promise.allSettled(
        Object.entries(BADGE_ENDPOINTS).map(async ([k, url]) => {
          try { const { data } = await api.get(url); res[k] = data.count ?? 0; }
          catch { res[k] = 0; }
        })
      );
      setBadges(res);
    };
    fetch();
    ref.current = setInterval(fetch, 60_000);
    return () => clearInterval(ref.current);
  }, []);

  return (
    <aside className={`fixed ltr:left-0 rtl:right-0 top-0 h-screen z-40
      bg-white dark:bg-gray-950
      border-r border-gray-100 dark:border-gray-800
      flex flex-col shadow-sm transition-all duration-300 ease-in-out
      ${collapsed ? 'w-16' : 'w-60'}`}>

      <SidebarLogo collapsed={collapsed} />

      {/* Collapse bubble */}
      <button onClick={onToggle}
        className="absolute -right-3 top-[26px] w-6 h-6 z-50
          bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
          rounded-full flex items-center justify-center shadow-md
          hover:border-orange-300 hover:shadow-lg transition-all">
        <i className={`ri-arrow-left-s-line text-[11px] text-gray-500 dark:text-gray-400
          transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5 scrollbar-thin scrollbar-thumb-gray-100 dark:scrollbar-thumb-gray-800">
        {navItems.map((item) => (
          <React.Fragment key={item.key}>
            {item.divider && <div className={`my-2 border-t border-gray-100 dark:border-gray-800 ${collapsed ? 'mx-2' : 'mx-3'}`} />}
            <NavItem item={item} collapsed={collapsed} badge={item.badge ? (badges[item.badge] ?? 0) : 0} />
          </React.Fragment>
        ))}
      </nav>

      {/* User card */}
      <div className={`border-t border-gray-100 dark:border-gray-800 ${collapsed ? 'p-2' : 'p-3'}`}>
        {collapsed ? (
          <img src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=f97316&color=fff&size=32&bold=true`}
            className="w-9 h-9 rounded-full mx-auto ring-2 ring-orange-200 dark:ring-orange-800 object-cover" alt="" />
        ) : (
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-50 dark:bg-gray-900">
            <img src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=f97316&color=fff&size=32&bold=true`}
              className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-orange-100 dark:ring-orange-900" alt="" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-orange-500 font-semibold capitalize truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
            <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
