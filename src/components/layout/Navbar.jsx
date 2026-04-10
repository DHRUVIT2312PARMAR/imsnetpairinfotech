// src/components/layout/Navbar.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeLang } from '../../context/ThemeLanguageContext';
import { t, timeAgo } from '../../config/i18n';
import { toast } from 'react-toastify';
import api from '../../services/api';

// ─── Constants ────────────────────────────────────────────────
const ROLE_STYLES = {
  superAdmin: 'bg-red-100 text-red-600 border border-red-200',
  admin:      'bg-orange-100 text-orange-600 border border-orange-200',
  hr:         'bg-purple-100 text-purple-600 border border-purple-200',
  employee:   'bg-blue-100 text-blue-600 border border-blue-200',
};
const ROLE_LABELS = {
  superAdmin: 'Super Admin',
  admin:      'Admin',
  hr:         'HR',
  employee:   'Employee',
};

// ─── Hook: outside click ─────────────────────────────────────
const useOutsideClick = (callback) => {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) callback(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [callback]);
  return ref;
};

// ─── Hook: live notifications ─────────────────────────────────
const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);

  // REST fetch
  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications?limit=15');
      setNotifications(data.data ?? []);
      setUnreadCount((data.data ?? []).filter((n) => !n.isRead).length);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Polling fallback: refresh every 30s
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markRead = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  }, []);

  return { notifications, unreadCount, loading, markRead, markAllRead, refetch: fetchNotifications };
};

// ─────────────────────────────────────────────────────────────
//  Notification Panel
// ─────────────────────────────────────────────────────────────
const NotificationPanel = ({ onClose }) => {
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const { lang } = useThemeLang();

  return (
    <div className="absolute right-0 top-full mt-2.5 w-[360px] z-50 rounded-2xl
      bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800
      shadow-2xl overflow-hidden animate-fade-in-down">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3
        bg-gradient-to-r from-orange-50 to-amber-50
        dark:from-gray-800 dark:to-gray-800
        border-b border-orange-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <i className="ri-notification-3-fill text-orange-500" />
          <span className="font-semibold text-sm text-gray-900 dark:text-white">
            {t(lang, 'notifications')}
          </span>
          {unreadCount > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="text-xs text-orange-500 hover:text-orange-600 hover:underline font-medium transition-colors">
            {t(lang, 'mark_all_read')}
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-3 flex gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full w-4/5" />
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full w-2/5" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="py-14 text-center text-gray-400 dark:text-gray-600">
            <i className="ri-notification-off-line text-4xl block mb-2" />
            <p className="text-sm">{t(lang, 'no_notifications')}</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button key={n._id} onClick={() => markRead(n._id)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors group
                ${n.isRead
                  ? 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  : 'bg-orange-50/60 dark:bg-orange-900/10 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                }`}
            >
              {/* Icon circle */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm
                ${n.isRead
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                  : 'bg-gradient-to-br from-orange-400 to-amber-400 text-white shadow-sm'
                }`}>
                <i className={n.icon ?? 'ri-notification-3-line'} />
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <p className={`text-xs leading-relaxed
                  ${n.isRead
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-gray-900 dark:text-gray-100 font-medium'
                  }`}>
                  {n.message}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">
                  {timeAgo(n.createdAt, lang)}
                </p>
              </div>

              {!n.isRead && (
                <span className="w-2 h-2 bg-orange-500 rounded-full shrink-0 mt-2" />
              )}
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <button onClick={onClose}
        className="w-full py-2.5 text-xs font-medium text-orange-500 hover:text-orange-600
          border-t border-gray-100 dark:border-gray-800
          hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors">
        {t(lang, 'view_all')} →
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  Theme Toggle Button (animated sun/moon)
// ─────────────────────────────────────────────────────────────
const ThemeToggle = () => {
  const { isDark, toggleTheme, lang } = useThemeLang();

  return (
    <button onClick={toggleTheme}
      title={t(lang, isDark ? 'light_mode' : 'dark_mode')}
      className="relative w-[52px] h-[26px] rounded-full transition-colors duration-300
        bg-gray-200 dark:bg-gray-700 flex items-center px-0.5 shrink-0
        hover:ring-2 hover:ring-orange-400 hover:ring-offset-1 focus:outline-none"
      aria-label="Toggle theme"
    >
      {/* Track icons */}
      <span className="absolute left-1.5 text-[10px]">☀️</span>
      <span className="absolute right-1.5 text-[10px]">🌙</span>
      {/* Thumb */}
      <span className={`relative z-10 w-[20px] h-[20px] rounded-full shadow-sm transition-transform duration-300
        flex items-center justify-center text-[10px]
        bg-white dark:bg-gray-900
        ${isDark ? 'translate-x-[26px]' : 'translate-x-0'}`}>
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
//  Profile Dropdown
// ─────────────────────────────────────────────────────────────
const ProfileDropdown = ({ user, onClose }) => {
  const navigate  = useNavigate();
  const { logout } = useAuth();
  const { lang }  = useThemeLang();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* silent */ }
    finally {
      logout();
      navigate('/');
      toast.success('Logged out successfully');
    }
  };

  const menuItems = [
    { icon: 'ri-user-line',        label: t(lang, 'my_profile'),      path: '/profile' },
    { icon: 'ri-settings-3-line',  label: t(lang, 'settings'),        path: '/settings' },
    { icon: 'ri-lock-password-line', label: t(lang, 'change_password'), path: '/settings' },
  ];

  const userName = `${user?.firstName} ${user?.lastName}`;
  const userAvatar = user?.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=f97316&color=fff&size=48&bold=true`;

  return (
    <div className="absolute right-0 top-full mt-2.5 w-60 z-50 rounded-2xl
      bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800
      shadow-2xl overflow-hidden animate-fade-in-down">

      {/* Avatar header */}
      <div className="relative px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800
        bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={userAvatar}
              alt={userName}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-orange-200 dark:ring-orange-800"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{userName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.systemEmail}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
              ${ROLE_STYLES[user?.role]}`}>
              {ROLE_LABELS[user?.role]}
            </span>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="py-1.5">
        {menuItems.map((item) => (
          <button key={item.label}
            onClick={() => { navigate(item.path); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
              text-gray-700 dark:text-gray-300
              hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <i className={`${item.icon} text-gray-400 dark:text-gray-500 text-base`} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="border-t border-gray-100 dark:border-gray-800 py-1.5">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500
            hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <i className="ri-logout-box-r-line text-base" />
          {t(lang, 'logout')}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  Main Navbar
// ─────────────────────────────────────────────────────────────
const Navbar = ({ sidebarCollapsed }) => {
  const { user }                      = useAuth();
  const { lang, currentLang }         = useThemeLang();
  const navigate                      = useNavigate();

  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [today,       setToday]       = useState('');

  // Live unread count (independent of panel)
  const [unreadCount, setUnreadCount] = useState(0);
  const { unreadCount: panelCount }   = useNotifications();
  useEffect(() => setUnreadCount(panelCount), [panelCount]);

  // Today string (re-renders at midnight)
  useEffect(() => {
    const update = () => setToday(
      new Date().toLocaleDateString(lang === 'en' ? 'en-US' : lang, {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      })
    );
    update();
    const ms = new Date().setHours(24, 0, 0, 0) - Date.now();
    const timeout = setTimeout(update, ms);
    return () => clearTimeout(timeout);
  }, [lang]);

  // Refs
  const notifRef   = useOutsideClick(useCallback(() => setNotifOpen(false),   []));
  const profileRef = useOutsideClick(useCallback(() => setProfileOpen(false), []));

  // Close others when one opens
  const openNotif   = () => { setNotifOpen((o) => !o);   setProfileOpen(false); };
  const openProfile = () => { setProfileOpen((o) => !o); setNotifOpen(false); };

  const userName = `${user?.firstName} ${user?.lastName}`;
  const userAvatar = user?.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=f97316&color=fff&size=32&bold=true`;

  return (
    <header className={`
      fixed top-0 right-0 h-16 z-30 transition-all duration-300
      bg-white/95 dark:bg-gray-950/95 backdrop-blur-md
      border-b border-gray-100 dark:border-gray-800 shadow-sm
      flex items-center px-4 gap-3
      ${sidebarCollapsed ? 'left-16' : 'left-60'}
    `}>

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
      <div className="w-px h-7 bg-gray-200 dark:bg-gray-800 shrink-0" />

      {/* ── Welcome ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">
          {t(lang, 'welcome')}, <span className="text-orange-500">{user?.firstName}!</span>
        </h1>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
          {t(lang, 'today_is')} {today}
        </p>
      </div>

      {/* ── Right controls ──────────────────────────────────── */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Role badge */}
        <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold
          ${ROLE_STYLES[user?.role] ?? ROLE_STYLES.employee}`}>
          {ROLE_LABELS[user?.role]}
        </span>

        {/* ── Profile button ── */}
        <div className="relative" ref={profileRef}>
          <button onClick={openProfile}
            className="flex items-center gap-2 pl-0.5 pr-2.5 py-1 rounded-full
              border border-gray-200 dark:border-gray-700
              hover:border-orange-300 dark:hover:border-orange-700
              hover:bg-orange-50 dark:hover:bg-orange-900/10
              transition-all duration-150">
            <div className="relative">
              <img
                src={userAvatar}
                alt={userName}
                className="w-7 h-7 rounded-full object-cover"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-950" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight max-w-[80px] truncate">
                {user?.firstName}
              </p>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 capitalize leading-tight">
                {ROLE_LABELS[user?.role]}
              </p>
            </div>
            <i className={`ri-arrow-down-s-line text-gray-400 text-sm transition-transform duration-200
              ${profileOpen ? 'rotate-180' : ''}`} />
          </button>
          {profileOpen && <ProfileDropdown user={user} onClose={() => setProfileOpen(false)} />}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

        {/* ── Theme toggle ── */}
        <ThemeToggle />

        {/* ── Notification bell ── */}
        <div className="relative" ref={notifRef}>
          <button onClick={openNotif}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl
              text-gray-500 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Notifications">
            <i className={`ri-notification-3-line text-lg transition-transform
              ${notifOpen ? 'scale-110 text-orange-500' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5
                min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold
                rounded-full flex items-center justify-center leading-none
                animate-bounce-once shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
