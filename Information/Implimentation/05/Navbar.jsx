// src/components/layout/Navbar.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeLang } from '../../context/ThemeLanguageContext';
import { ROLE_PILL, ROLE_LABEL } from '../../config/colors';
import { timeAgo } from '../../i18n';
import { toast } from 'react-toastify';
import api from '../../services/api';

// ─── Outside-click hook ───────────────────────────────────────
const useOutside = (cb) => {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) cb(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [cb]);
  return ref;
};

// ─── Live notifications hook ──────────────────────────────────
const useNotifications = () => {
  const [list,  setList]  = useState([]);
  const [count, setCount] = useState(0);
  const [busy,  setBusy]  = useState(true);
  const wsRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/notifications?limit=15');
      const items = data.data ?? [];
      setList(items);
      setCount(items.filter((n) => !n.is_read).length);
    } catch { /* silent */ } finally { setBusy(false); }
  }, []);

  useEffect(() => {
    load();
    try {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${proto}://${location.host}/ws/notifications`);
      wsRef.current = ws;
      ws.onmessage = ({ data }) => {
        try {
          const msg = JSON.parse(data);
          if (msg.type === 'NEW_NOTIFICATION') {
            setList((p) => [msg.notification, ...p].slice(0, 15));
            setCount((c) => c + 1);
            toast.info(msg.notification.message, { autoClose: 4000 });
          }
        } catch { /* bad json */ }
      };
      ws.onerror = () => ws.close();
    } catch { /* no WS */ }
    const id = setInterval(load, 30_000);
    return () => { clearInterval(id); wsRef.current?.close(); };
  }, [load]);

  const markOne = useCallback(async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setList((p) => p.map((n) => n.id === id ? { ...n, is_read: true } : n));
      setCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  }, []);

  const markAll = useCallback(async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setList((p) => p.map((n) => ({ ...n, is_read: true })));
      setCount(0);
    } catch { /* silent */ }
  }, []);

  return { list, count, busy, markOne, markAll };
};

// ─── Styles helpers ───────────────────────────────────────────
const panelStyle = {
  position: 'absolute', right: 0, top: 'calc(100% + 10px)',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
  zIndex: 100,
  overflow: 'hidden',
  animation: 'fadeDown 150ms ease-out',
};

// ─── Notification Panel ───────────────────────────────────────
const NotificationPanel = ({ onClose }) => {
  const { t, lang } = useThemeLang();
  const { list, count, busy, markOne, markAll } = useNotifications();

  return (
    <div style={{ ...panelStyle, width: 340 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'var(--bg-hover)',
        borderBottom: '1px solid var(--border-default)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ri-notification-3-fill" style={{ color: '#F26B2E', fontSize: 16 }} />
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
            {t('navbar.notifications')}
          </span>
          {count > 0 && (
            <span style={{
              background: '#EF4444', color: '#fff',
              fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 9999,
              minWidth: 18, textAlign: 'center',
            }}>{count > 99 ? '99+' : count}</span>
          )}
        </div>
        {count > 0 && (
          <button onClick={markAll}
            style={{ fontSize: 11, fontWeight: 600, color: '#F26B2E', background: 'none', border: 'none', cursor: 'pointer' }}>
            {t('navbar.mark_all_read')}
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {busy ? (
          [...Array(4)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--border-subtle)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ height: 10, background: 'var(--border-subtle)', borderRadius: 6, width: '75%' }} />
                <div style={{ height: 8, background: 'var(--border-subtle)', borderRadius: 6, width: '45%' }} />
              </div>
            </div>
          ))
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <i className="ri-notification-off-line" style={{ fontSize: 32, color: 'var(--text-faint)', display: 'block', marginBottom: 8 }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{t('navbar.no_notifications')}</p>
          </div>
        ) : list.map((n) => (
          <button key={n.id} onClick={() => markOne(n.id)}
            style={{
              width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '12px 16px', textAlign: 'left', border: 'none', cursor: 'pointer',
              background: n.is_read ? 'transparent' : 'rgba(242,107,46,0.06)',
              borderBottom: '1px solid var(--border-default)',
              transition: 'background 120ms',
            }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              background: n.is_read ? 'var(--border-subtle)' : 'linear-gradient(135deg,#F26B2E,#F59E0B)',
              color: n.is_read ? 'var(--text-muted)' : '#fff',
            }}>
              <i className={n.icon ?? 'ri-notification-3-line'} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, lineHeight: 1.5, margin: 0,
                color: n.is_read ? 'var(--text-muted)' : 'var(--text-primary)',
                fontWeight: n.is_read ? 400 : 600 }}>
                {n.message}
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                {timeAgo(n.created_at, lang)}
              </p>
            </div>
            {!n.is_read && (
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F26B2E', flexShrink: 0, marginTop: 4 }} />
            )}
          </button>
        ))}
      </div>

      <button onClick={onClose}
        style={{
          width: '100%', padding: '10px 16px', textAlign: 'center',
          fontSize: 12, fontWeight: 600, color: '#F26B2E',
          background: 'none', border: 'none', borderTop: '1px solid var(--border-default)',
          cursor: 'pointer',
        }}>
        {t('navbar.view_all')} →
      </button>
    </div>
  );
};

// ─── Language Picker ──────────────────────────────────────────
const LangPicker = ({ onClose }) => {
  const { lang, setLang, LANGUAGES } = useThemeLang();
  return (
    <div style={{ ...panelStyle, width: 200 }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-default)' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
          Language / भाषा
        </p>
      </div>
      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        {LANGUAGES.map((l) => (
          <button key={l.code} onClick={() => { setLang(l.code); onClose(); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', border: 'none', cursor: 'pointer', textAlign: 'left',
              background: lang === l.code ? 'rgba(242,107,46,0.08)' : 'transparent',
              color: lang === l.code ? '#F26B2E' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: lang === l.code ? 600 : 400,
              transition: 'background 120ms',
            }}>
            <span style={{ fontSize: 16 }}>{l.flag}</span>
            <span style={{ flex: 1 }}>{l.nativeLabel}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l.short}</span>
            {lang === l.code && <i className="ri-check-line" style={{ fontSize: 14, color: '#F26B2E' }} />}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Theme Toggle ─────────────────────────────────────────────
const ThemeSwitch = () => {
  const { isDark, toggleTheme } = useThemeLang();
  return (
    <button onClick={toggleTheme}
      style={{
        position: 'relative',
        width: 52, height: 26, borderRadius: 9999,
        background: isDark ? '#374151' : '#FFF2EB',
        border: `1px solid ${isDark ? '#4B5563' : '#FDD9BF'}`,
        cursor: 'pointer', padding: 2,
        display: 'flex', alignItems: 'center',
        flexShrink: 0,
        transition: 'background 300ms, border-color 300ms',
      }}>
      {/* Track labels */}
      <span style={{ position: 'absolute', left: 6, fontSize: 10, lineHeight: 1, pointerEvents: 'none' }}>☀️</span>
      <span style={{ position: 'absolute', right: 6, fontSize: 10, lineHeight: 1, pointerEvents: 'none' }}>🌙</span>
      {/* Thumb */}
      <span style={{
        position: 'relative', zIndex: 1,
        width: 20, height: 20, borderRadius: '50%',
        background: isDark ? '#111827' : '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
        transform: isDark ? 'translateX(26px)' : 'translateX(0)',
        transition: 'transform 300ms ease',
      }}>
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  );
};

// ─── Profile Dropdown ─────────────────────────────────────────
const ProfileMenu = ({ user, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useThemeLang();

  const doLogout = async () => {
    try { await api.post('/api/auth/logout'); } catch { /* silent */ }
    logout();
    navigate('/');
    toast.success('Logged out');
  };

  const [imgFailed, setImgFailed] = useState(false);
  const avatarSrc = user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=F26B2E&color=fff&size=48&bold=true`;

  return (
    <div style={{ ...panelStyle, width: 230 }}>
      {/* User header */}
      <div style={{
        padding: '14px 16px',
        background: 'var(--bg-hover)',
        borderBottom: '1px solid var(--border-default)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img src={imgFailed ? avatarSrc : (user?.avatar || avatarSrc)}
            onError={() => setImgFailed(true)}
            style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', border: '2px solid var(--brand-border, #FDD9BF)' }}
            alt="" />
          <span style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 11, height: 11, borderRadius: '50%',
            background: '#10B981', border: '2px solid var(--bg-card)',
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.name}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '1px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.email}
          </p>
        </div>
      </div>

      {/* Menu items */}
      <div style={{ padding: '6px 0' }}>
        {[
          { icon: 'ri-user-line',          key: 'navbar.my_profile',       path: '/profile' },
          { icon: 'ri-settings-3-line',    key: 'navbar.settings',         path: '/settings' },
          { icon: 'ri-lock-password-line', key: 'navbar.change_password',  path: '/settings/password' },
        ].map((item) => (
          <button key={item.key} onClick={() => { navigate(item.path); onClose(); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '9px 16px', border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-secondary)',
              fontSize: 13, textAlign: 'left', transition: 'background 120ms',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <i className={item.icon} style={{ fontSize: 15, color: 'var(--text-muted)', width: 18, textAlign: 'center' }} />
            {t(item.key)}
          </button>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--border-default)', padding: '6px 0' }}>
        <button onClick={doLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '9px 16px', border: 'none', cursor: 'pointer',
            background: 'transparent', color: '#EF4444', fontSize: 13, textAlign: 'left',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <i className="ri-logout-box-r-line" style={{ fontSize: 15, width: 18, textAlign: 'center' }} />
          {t('navbar.logout')}
        </button>
      </div>
    </div>
  );
};

// ─── Main Navbar ──────────────────────────────────────────────
const Navbar = ({ sidebarCollapsed }) => {
  const { user } = useAuth();
  const { t, lang, currentLang } = useThemeLang();
  const navigate = useNavigate();

  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen,    setLangOpen]    = useState(false);
  const [today, setToday] = useState('');
  const [imgFailed, setImgFailed] = useState(false);

  const { count: bellCount } = useNotifications();

  useEffect(() => {
    const update = () => setToday(new Date().toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    }));
    update();
    const tid = setTimeout(update, new Date().setHours(24, 0, 0, 0) - Date.now());
    return () => clearTimeout(tid);
  }, [lang]);

  const notifRef   = useOutside(useCallback(() => setNotifOpen(false),   []));
  const profileRef = useOutside(useCallback(() => setProfileOpen(false), []));
  const langRef    = useOutside(useCallback(() => setLangOpen(false),    []));

  const open = (which) => {
    setNotifOpen(which === 'notif' ? (o) => !o : false);
    setProfileOpen(which === 'profile' ? (o) => !o : false);
    setLangOpen(which === 'lang' ? (o) => !o : false);
  };

  const avatarSrc = user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=F26B2E&color=fff&size=32&bold=true`;

  const rolePill = ROLE_PILL[user?.role] ?? ROLE_PILL.employee;

  return (
    <>
      <style>{`@keyframes fadeDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <header style={{
        position: 'fixed',
        top: 0, right: 0,
        left: sidebarCollapsed ? 64 : 240,
        height: 64,
        zIndex: 30,
        background: 'var(--bg-navbar)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--border-default)',
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
        transition: 'left 300ms ease',
      }}>

        {/* ── Logo + Brand ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* 32×32 hard-constrained logo */}
          <div style={{
            width: 32, height: 32, minWidth: 32, maxWidth: 32,
            minHeight: 32, maxHeight: 32,
            borderRadius: 8, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <img
              src="/logo1.png"
              alt="NP"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement.style.background = '#F26B2E';
                e.currentTarget.insertAdjacentHTML('afterend',
                  '<span style="color:#fff;font-weight:900;font-size:11px;letter-spacing:-1px">NP</span>');
              }}
              style={{ width: 32, height: 32, objectFit: 'contain', display: 'block' }}
            />
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <p style={{ fontSize: 12, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Netpair</p>
            <p style={{ fontSize: 8, fontWeight: 700, color: '#F26B2E', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>Infotech</p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'var(--border-subtle)', flexShrink: 0 }} />

        {/* ── Welcome ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t('navbar.welcome')}, <span style={{ color: '#F26B2E' }}>{user?.name?.split(' ')[0]}!</span>
          </p>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>
            {t('navbar.today_is')} {today}
          </p>
        </div>

        {/* ── Right controls ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

          {/* Role badge */}
          <span className={rolePill} style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
            {ROLE_LABEL[user?.role]}
          </span>

          {/* Profile */}
          <div style={{ position: 'relative' }} ref={profileRef}>
            <button onClick={() => open('profile')}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '3px 10px 3px 3px',
                borderRadius: 9999, border: '1px solid var(--border-subtle)',
                background: profileOpen ? 'var(--bg-hover)' : 'transparent',
                cursor: 'pointer', transition: 'background 120ms',
              }}>
              <div style={{ position: 'relative' }}>
                <img src={imgFailed ? avatarSrc : avatarSrc}
                  onError={() => setImgFailed(true)}
                  style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                  alt="" />
                <span style={{
                  position: 'absolute', bottom: -1, right: -1,
                  width: 9, height: 9, borderRadius: '50%',
                  background: '#10B981', border: '2px solid var(--bg-navbar)',
                }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', margin: 0, maxWidth: 80, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name?.split(' ')[0]}
                </p>
                <p style={{ fontSize: 9, color: 'var(--text-muted)', margin: 0, textTransform: 'capitalize' }}>
                  {ROLE_LABEL[user?.role]}
                </p>
              </div>
              <i className="ri-arrow-down-s-line"
                style={{ fontSize: 13, color: 'var(--text-muted)', transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
            </button>
            {profileOpen && <ProfileMenu user={user} onClose={() => setProfileOpen(false)} />}
          </div>

          {/* Separator */}
          <div style={{ width: 1, height: 24, background: 'var(--border-subtle)' }} />

          {/* Language */}
          <div style={{ position: 'relative' }} ref={langRef}>
            <button onClick={() => open('lang')}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 8px',
                borderRadius: 8, border: 'none',
                background: langOpen ? 'var(--bg-hover)' : 'transparent',
                cursor: 'pointer', transition: 'background 120ms',
              }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>{currentLang.flag}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{currentLang.short}</span>
              <i className="ri-arrow-down-s-line"
                style={{ fontSize: 12, color: 'var(--text-muted)', transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
            </button>
            {langOpen && <LangPicker onClose={() => setLangOpen(false)} />}
          </div>

          {/* Theme toggle */}
          <ThemeSwitch />

          {/* Notifications */}
          <div style={{ position: 'relative' }} ref={notifRef}>
            <button onClick={() => open('notif')}
              style={{
                width: 36, height: 36, borderRadius: 8, border: 'none',
                background: notifOpen ? 'var(--bg-hover)' : 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', transition: 'background 120ms',
              }}>
              <i className="ri-notification-3-line"
                style={{ fontSize: 17, color: notifOpen ? '#F26B2E' : 'var(--text-secondary)' }} />
              {bellCount > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  minWidth: 15, height: 15, padding: '0 3px',
                  background: '#EF4444', color: '#fff',
                  fontSize: 9, fontWeight: 900, borderRadius: 9999,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1,
                }}>
                  {bellCount > 9 ? '9+' : bellCount}
                </span>
              )}
            </button>
            {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
          </div>

          {/* Logout */}
          <button
            onClick={async () => {
              try { await api.post('/api/auth/logout'); } catch { /* silent */ }
              navigate('/');
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, border: 'none',
              background: '#EF4444', color: '#fff',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              transition: 'background 120ms',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#DC2626'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#EF4444'}
          >
            <i className="ri-logout-box-r-line" style={{ fontSize: 14 }} />
            <span style={{ display: window.innerWidth < 640 ? 'none' : 'inline' }}>
              {t('navbar.logout')}
            </span>
          </button>
        </div>
      </header>
    </>
  );
};

export default Navbar;
