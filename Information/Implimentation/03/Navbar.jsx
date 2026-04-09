// src/components/layout/Navbar.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeLang } from '../../context/ThemeLanguageContext';
import { timeAgo } from '../../i18n';
import { toast } from 'react-toastify';
import api from '../../services/api';

// ─── Role styles ─────────────────────────────────────────────
const ROLE_PILL = {
  super_admin: 'bg-red-100    text-red-600    border border-red-200    dark:bg-red-900/30   dark:text-red-400   dark:border-red-800',
  admin:       'bg-orange-100 text-orange-600 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  hr:          'bg-purple-100 text-purple-600 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  employee:    'bg-blue-100   text-blue-600   border border-blue-200   dark:bg-blue-900/30  dark:text-blue-400  dark:border-blue-800',
};
const ROLE_LABEL = { super_admin: 'Super Admin', admin: 'Admin', hr: 'HR', employee: 'Employee' };

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

  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get('/api/notifications?limit=15');
      const items = data.data ?? [];
      setList(items);
      setCount(items.filter((n) => !n.is_read).length);
    } catch { /* silent */ } finally { setBusy(false); }
  }, []);

  useEffect(() => {
    fetch();
    // WebSocket for instant push
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
    } catch { /* no WS available */ }
    // Polling fallback
    const id = setInterval(fetch, 30_000);
    return () => { clearInterval(id); wsRef.current?.close(); };
  }, [fetch]);

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

// ─────────────────────────────────────────────────────────────
//  Notification Panel
// ─────────────────────────────────────────────────────────────
const NotificationPanel = ({ onClose }) => {
  const { t, lang }              = useThemeLang();
  const { list, count, busy, markOne, markAll } = useNotifications();

  return (
    <div className="absolute ltr:right-0 rtl:left-0 top-full mt-2.5 w-[360px] z-50
      rounded-2xl shadow-2xl overflow-hidden
      bg-white dark:bg-gray-900
      border border-gray-100 dark:border-gray-800
      animate-[fadeDown_150ms_ease-out]">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3
        border-b border-gray-100 dark:border-gray-800
        bg-gradient-to-r from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-center gap-2">
          <i className="ri-notification-3-fill text-orange-500" />
          <span className="font-bold text-sm text-gray-900 dark:text-white">{t('navbar.notifications')}</span>
          {count > 0 && (
            <span className="min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </div>
        {count > 0 && (
          <button onClick={markAll} className="text-xs font-semibold text-orange-500 hover:underline">
            {t('navbar.mark_all_read')}
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
        {busy ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 px-4 py-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 w-4/5" />
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 w-2/5" />
              </div>
            </div>
          ))
        ) : list.length === 0 ? (
          <div className="py-14 text-center">
            <i className="ri-notification-off-line text-4xl text-gray-300 dark:text-gray-700 block mb-2" />
            <p className="text-sm text-gray-400 dark:text-gray-600">{t('navbar.no_notifications')}</p>
          </div>
        ) : list.map((n) => (
          <button key={n.id} onClick={() => markOne(n.id)}
            className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors
              ${n.is_read
                ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                : 'bg-orange-50/70 dark:bg-orange-900/10 hover:bg-orange-50 dark:hover:bg-orange-900/20'
              }`}>
            <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm
              ${n.is_read ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                          : 'bg-gradient-to-br from-orange-400 to-amber-400 text-white shadow-sm'}`}>
              <i className={n.icon ?? 'ri-notification-3-line'} />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className={`text-xs leading-relaxed ${n.is_read
                ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100 font-semibold'}`}>
                {n.message}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">
                {timeAgo(n.created_at, lang)}
              </p>
            </div>
            {!n.is_read && <span className="w-2 h-2 bg-orange-500 rounded-full shrink-0 mt-2" />}
          </button>
        ))}
      </div>

      <button onClick={onClose}
        className="w-full py-2.5 text-xs font-semibold text-orange-500 hover:text-orange-600
          border-t border-gray-100 dark:border-gray-800
          hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors">
        {t('navbar.view_all')} →
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  Language Picker
// ─────────────────────────────────────────────────────────────
const LangPicker = ({ onClose }) => {
  const { lang, setLang, LANGUAGES } = useThemeLang();
  return (
    <div className="absolute ltr:right-0 rtl:left-0 top-full mt-2.5 w-52 z-50
      rounded-2xl shadow-2xl overflow-hidden
      bg-white dark:bg-gray-900
      border border-gray-100 dark:border-gray-800
      animate-[fadeDown_150ms_ease-out]">
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Language / भाषा / ભાષા
        </p>
      </div>
      <div className="py-1 max-h-72 overflow-y-auto">
        {LANGUAGES.map((l) => (
          <button key={l.code} onClick={() => { setLang(l.code); onClose(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors
              ${lang === l.code
                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            <span className="text-lg leading-none">{l.flag}</span>
            <span className="flex-1 text-left">{l.nativeLabel}</span>
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{l.short}</span>
            {lang === l.code && <i className="ri-check-line text-orange-500" />}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  Theme Toggle  (pill-style animated switch)
// ─────────────────────────────────────────────────────────────
const ThemeSwitch = () => {
  const { isDark, toggleTheme, t } = useThemeLang();
  return (
    <button onClick={toggleTheme}
      title={t(isDark ? 'navbar.light_mode' : 'navbar.dark_mode')}
      aria-label="Toggle theme"
      className={`relative flex items-center w-14 h-7 rounded-full px-1 transition-colors duration-300 focus:outline-none
        hover:ring-2 hover:ring-orange-400 hover:ring-offset-1 dark:hover:ring-offset-gray-950
        ${isDark ? 'bg-gray-700' : 'bg-orange-100'}`}>
      {/* Track labels */}
      <span className="absolute left-1.5 text-[11px] select-none">☀️</span>
      <span className="absolute right-1.5 text-[11px] select-none">🌙</span>
      {/* Thumb */}
      <span className={`relative z-10 w-5 h-5 rounded-full shadow-md transition-transform duration-300
        flex items-center justify-center text-[11px]
        bg-white dark:bg-gray-900
        ${isDark ? 'translate-x-7' : 'translate-x-0'}`}>
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
//  Profile Dropdown
// ─────────────────────────────────────────────────────────────
const ProfileMenu = ({ user, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useThemeLang();

  const doLogout = async () => {
    try { await api.post('/api/auth/logout'); } catch { /* silent */ }
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  return (
    <div className="absolute ltr:right-0 rtl:left-0 top-full mt-2.5 w-60 z-50
      rounded-2xl shadow-2xl overflow-hidden
      bg-white dark:bg-gray-900
      border border-gray-100 dark:border-gray-800
      animate-[fadeDown_150ms_ease-out]">

      {/* User header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800
        bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={user?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=f97316&color=fff&size=48&bold=true`}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-orange-200 dark:ring-orange-800" alt="" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
            <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full
              ${ROLE_PILL[user?.role] ?? ROLE_PILL.employee}`}>
              {ROLE_LABEL[user?.role]}
            </span>
          </div>
        </div>
      </div>

      <div className="py-1">
        {[
          { icon: 'ri-user-line',         key: 'navbar.my_profile',      path: '/profile' },
          { icon: 'ri-settings-3-line',   key: 'navbar.settings',        path: '/settings' },
          { icon: 'ri-lock-password-line', key: 'navbar.change_password', path: '/settings/password' },
        ].map((item) => (
          <button key={item.key} onClick={() => { navigate(item.path); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
              text-gray-700 dark:text-gray-300
              hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <i className={`${item.icon} text-gray-400 dark:text-gray-500 text-base`} />
            {t(item.key)}
          </button>
        ))}
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 py-1">
        <button onClick={doLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500
            hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <i className="ri-logout-box-r-line text-base" />
          {t('navbar.logout')}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  Main Navbar
// ─────────────────────────────────────────────────────────────
const Navbar = ({ sidebarCollapsed }) => {
  const { user }                  = useAuth();
  const { t, lang, currentLang }  = useThemeLang();
  const navigate                  = useNavigate();

  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen,    setLangOpen]    = useState(false);
  const [today,       setToday]       = useState('');

  // Today string — re-calculates at midnight
  useEffect(() => {
    const update = () => setToday(
      new Date().toLocaleDateString(lang === 'en' ? 'en-US' : lang, {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      })
    );
    update();
    const ms  = new Date().setHours(24, 0, 0, 0) - Date.now();
    const tid = setTimeout(update, ms);
    return () => clearTimeout(tid);
  }, [lang]);

  // Refs for outside-click
  const notifRef   = useOutside(useCallback(() => setNotifOpen(false),   []));
  const profileRef = useOutside(useCallback(() => setProfileOpen(false), []));
  const langRef    = useOutside(useCallback(() => setLangOpen(false),    []));

  // Quick notification count (independent of panel)
  const { count: bellCount } = useNotifications();

  const openNotif   = () => { setNotifOpen((o) => !o);   setProfileOpen(false); setLangOpen(false); };
  const openProfile = () => { setProfileOpen((o) => !o); setNotifOpen(false);   setLangOpen(false); };
  const openLang    = () => { setLangOpen((o) => !o);    setNotifOpen(false);   setProfileOpen(false); };

  return (
    <header className={`
      fixed top-0 right-0 h-16 z-30
      bg-white/95 dark:bg-gray-950/95 backdrop-blur-md
      border-b border-gray-100 dark:border-gray-800 shadow-sm
      flex items-center px-4 gap-3 transition-all duration-300
      ${sidebarCollapsed ? 'left-16' : 'left-60'}
    `}>

      {/* ── Logo + Brand ──────────────────────────────── */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center
          bg-gradient-to-br from-orange-400 to-amber-500 shadow-sm shrink-0">
          <img src="/src/assets/imgs/Netpairlogo.png" alt="Netpair"
            className="w-8 h-8 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement.innerHTML =
                `<span style="font-weight:900;font-size:12px;color:white;letter-spacing:-1px">NP</span>`;
            }} />
        </div>
        <div className="hidden md:block leading-tight">
          <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight">Netpair</p>
          <p className="text-[9px] font-bold text-orange-500 tracking-[0.15em] uppercase">Infotech</p>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-7 bg-gray-200 dark:bg-gray-800 mx-1 shrink-0" />

      {/* ── Welcome ───────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">
          {t('navbar.welcome')},{' '}
          <span className="text-orange-500">{user?.name?.split(' ')[0]}!</span>
        </h1>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
          {t('navbar.today_is')} {today}
        </p>
      </div>

      {/* ── Right Controls ────────────────────────────── */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Role pill */}
        <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold
          ${ROLE_PILL[user?.role] ?? ROLE_PILL.employee}`}>
          {ROLE_LABEL[user?.role]}
        </span>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button onClick={openProfile}
            className="flex items-center gap-2 pl-0.5 pr-2.5 py-1 rounded-full
              border border-gray-200 dark:border-gray-700
              hover:border-orange-300 dark:hover:border-orange-700
              hover:bg-orange-50 dark:hover:bg-orange-900/10
              transition-all duration-150">
            <div className="relative">
              <img src={user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=f97316&color=fff&size=32&bold=true`}
                className="w-7 h-7 rounded-full object-cover" alt="" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-950" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight max-w-[80px] truncate">
                {user?.name?.split(' ')[0]}
              </p>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 capitalize leading-tight">
                {ROLE_LABEL[user?.role]}
              </p>
            </div>
            <i className={`ri-arrow-down-s-line text-gray-400 text-sm transition-transform duration-200
              ${profileOpen ? 'rotate-180' : ''}`} />
          </button>
          {profileOpen && <ProfileMenu user={user} onClose={() => setProfileOpen(false)} />}
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

        {/* Language */}
        <div className="relative" ref={langRef}>
          <button onClick={openLang}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
              text-xs font-bold text-gray-600 dark:text-gray-300
              hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <span className="text-base leading-none">{currentLang.flag}</span>
            <span className="hidden sm:inline">{currentLang.short}</span>
            <i className={`ri-arrow-down-s-line text-gray-400 text-xs transition-transform duration-200
              ${langOpen ? 'rotate-180' : ''}`} />
          </button>
          {langOpen && <LangPicker onClose={() => setLangOpen(false)} />}
        </div>

        {/* Theme toggle */}
        <ThemeSwitch />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={openNotif}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl
              text-gray-500 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <i className={`ri-notification-3-${notifOpen ? 'fill' : 'line'} text-lg
              ${notifOpen ? 'text-orange-500' : ''} transition-colors`} />
            {bellCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[15px] h-[15px] px-0.5
                bg-red-500 text-white text-[9px] font-black rounded-full
                flex items-center justify-center leading-none shadow-sm
                animate-[ping_1s_ease-in-out_1]">
                {bellCount > 9 ? '9+' : bellCount}
              </span>
            )}
          </button>
          {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
        </div>

        {/* Logout */}
        <button onClick={async () => {
          try { await api.post('/api/auth/logout'); } catch { /* silent */ }
          // call logout from auth context via navigate + state clear
          navigate('/');
        }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold
            bg-red-500 hover:bg-red-600 active:scale-95 text-white transition-all shadow-sm">
          <i className="ri-logout-box-r-line text-sm" />
          <span className="hidden sm:inline">{t('navbar.logout')}</span>
        </button>

      </div>
    </header>
  );
};

export default Navbar;
