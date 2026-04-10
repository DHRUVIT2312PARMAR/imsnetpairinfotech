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
  const location = useLocation();
  const { t } = useThemeLang();
  const [open, setOpen] = useState(false);
  const hasChildren = item.children?.length > 0;

  // Translated label
  const label = t(`nav.${item.key}`) !== `nav.${item.key}` ? t(`nav.${item.key}`) : item.label;

  useEffect(() => {
    if (hasChildren && item.children.some((c) => location.pathname.startsWith(c.path)))
      setOpen(true);
  }, [location.pathname]);

  const isActive = hasChildren
    ? item.children.some((c) => location.pathname.startsWith(c.path))
    : location.pathname === item.path || location.pathname.startsWith(item.path + '/');

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: depth === 0 ? '9px 12px' : '7px 12px',
    margin: depth === 0 ? '1px 8px' : '1px 8px 1px 28px',
    borderRadius: 10,
    cursor: 'pointer',
    userSelect: 'none',
    fontSize: 13,
    fontWeight: isActive ? 600 : 500,
    color: isActive ? '#F26B2E' : 'var(--text-secondary)',
    background: isActive ? 'var(--bg-active)' : 'transparent',
    borderLeft: isActive && depth === 0 ? '3px solid #F26B2E' : '3px solid transparent',
    transition: 'background 120ms, color 120ms',
    position: 'relative',
    textDecoration: 'none',
  };

  const iconStyle = {
    fontSize: 16,
    lineHeight: 1,
    flexShrink: 0,
    color: isActive ? '#F26B2E' : 'var(--text-muted)',
    width: 18,
    textAlign: 'center',
  };

  const inner = (
    <>
      <i className={item.icon} style={iconStyle} />

      {/* Label */}
      <span style={{
        flex: 1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        opacity: collapsed ? 0 : 1,
        width: collapsed ? 0 : 'auto',
        transition: 'opacity 200ms, width 200ms',
      }}>
        {label}
      </span>

      {/* Badge pill */}
      {!collapsed && badge > 0 && (
        <span style={{
          minWidth: 18, height: 18, padding: '0 4px',
          background: '#EF4444', color: '#fff',
          fontSize: 10, fontWeight: 700, borderRadius: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1, flexShrink: 0,
        }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}

      {/* Collapsed dot */}
      {collapsed && badge > 0 && (
        <span style={{
          position: 'absolute', top: 6, right: 4,
          width: 7, height: 7, borderRadius: '50%', background: '#EF4444',
        }} />
      )}

      {/* Chevron */}
      {!collapsed && hasChildren && (
        <i className="ri-arrow-right-s-line" style={{
          fontSize: 14, color: 'var(--text-muted)',
          transform: open ? 'rotate(90deg)' : 'none',
          transition: 'transform 200ms',
          flexShrink: 0,
        }} />
      )}

      {/* Tooltip when collapsed */}
      {collapsed && (
        <div style={{
          position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
          marginLeft: 12, zIndex: 100, pointerEvents: 'none',
          background: '#1F2937', color: '#F9FAFB',
          fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 7,
          whiteSpace: 'nowrap', opacity: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        }} className="np-tooltip">
          {label}
          {badge > 0 && <span style={{ marginLeft: 4, color: '#F87171' }}>({badge})</span>}
        </div>
      )}
    </>
  );

  if (hasChildren) {
    return (
      <div>
        <div style={itemStyle} onClick={() => !collapsed && setOpen((o) => !o)}>
          {inner}
        </div>
        <div style={{
          maxHeight: open && !collapsed ? 300 : 0,
          overflow: 'hidden',
          transition: 'max-height 200ms ease',
        }}>
          {item.children.map((c) => (
            <NavItem key={c.key} item={c} collapsed={false} depth={1} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <NavLink to={item.path} style={({ isActive: a }) => ({ ...itemStyle, ...(a ? {} : {}), textDecoration: 'none' })}>
      {inner}
    </NavLink>
  );
};

// ─── Main Sidebar ─────────────────────────────────────────────
const Sidebar = ({ collapsed, onToggle }) => {
  const { user } = useAuth();
  const [badges, setBadges] = useState({});
  const intervalRef = useRef(null);
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
    intervalRef.current = setInterval(fetch, 60_000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <>
      {/* Tooltip hover styles */}
      <style>{`
        .np-tooltip-parent:hover .np-tooltip { opacity: 1 !important; }
        .np-sidebar-nav a:hover { background: var(--bg-hover) !important; color: var(--text-primary) !important; }
        .np-sidebar-nav a i { transition: color 120ms; }
        .np-sidebar-nav a:hover i { color: #F26B2E !important; }
      `}</style>

      <aside style={{
        position: 'fixed',
        left: 0, top: 0,
        height: '100vh',
        width: collapsed ? 64 : 240,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-default)',
        boxShadow: '1px 0 12px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
        transition: 'width 300ms ease',
        overflow: 'hidden', // CRITICAL — prevents logo from escaping
      }}>

        <SidebarLogo collapsed={collapsed} />

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          style={{
            position: 'absolute', right: -12, top: 20,
            width: 24, height: 24, borderRadius: '50%', zIndex: 50,
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'box-shadow 150ms',
          }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <i className="ri-arrow-left-s-line" style={{
            fontSize: 12, color: 'var(--text-muted)',
            transform: collapsed ? 'rotate(180deg)' : 'none',
            transition: 'transform 300ms',
          }} />
        </button>

        {/* Nav list */}
        <nav
          className="np-sidebar-nav"
          style={{
            flex: 1,
            overflowY: 'auto', overflowX: 'hidden',
            paddingTop: 8, paddingBottom: 8,
          }}
        >
          {navItems.map((item) => (
            <React.Fragment key={item.key}>
              {item.divider && (
                <div style={{
                  height: 1,
                  background: 'var(--border-default)',
                  margin: '8px 12px',
                }} />
              )}
              <div className="np-tooltip-parent">
                <NavItem
                  item={item}
                  collapsed={collapsed}
                  badge={item.badge ? (badges[item.badge] ?? 0) : 0}
                />
              </div>
            </React.Fragment>
          ))}
        </nav>

        {/* User card at bottom */}
        <div style={{
          borderTop: '1px solid var(--border-default)',
          padding: collapsed ? 8 : 12,
          flexShrink: 0,
        }}>
          {collapsed ? (
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=F26B2E&color=fff&size=32&bold=true`}
              alt=""
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', display: 'block', margin: '0 auto' }}
            />
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 10,
              background: 'var(--bg-hover)',
            }}>
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=F26B2E&color=fff&size=32&bold=true`}
                alt=""
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name}
                </p>
                <p style={{ fontSize: 10, fontWeight: 600, color: '#F26B2E', margin: 0, textTransform: 'capitalize' }}>
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
