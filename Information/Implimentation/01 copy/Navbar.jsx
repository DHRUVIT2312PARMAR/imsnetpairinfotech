// src/components/layout/Navbar.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api';

// ─── Role pill ───────────────────────────────────────────────
const ROLE_STYLES = {
  super_admin: 'bg-red-50 text-red-600 border-red-200',
  admin:       'bg-orange-50 text-orange-600 border-orange-200',
  hr:          'bg-purple-50 text-purple-600 border-purple-200',
  employee:    'bg-blue-50 text-blue-600 border-blue-200',
};
const ROLE_LABELS = { super_admin: 'SuperAdmin', admin: 'Admin', hr: 'HR', employee: 'Employee' };

// ─── Notification panel ──────────────────────────────────────
const NotificationPanel = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/notifications?limit=10')
      .then(({ data }) => setNotifications(data.data ?? []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch { /* silent */ }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-semibold text-sm text-gray-900">
          Notifications {unreadCount > 0 && <span className="text-orange-500">({unreadCount})</span>}
        </span>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-orange-500 hover:underline">
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="px-4 py-3 flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 bg-gray-100 rounded w-3/4" />
                <div className="h-2 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            <i className="ri-notification-off-line text-3xl mb-2 block" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors
                ${n.is_read ? 'hover:bg-gray-50' : 'bg-orange-50/50 hover:bg-orange-50'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm
                ${n.is_read ? 'bg-gray-100 text-gray-400' : 'bg-orange-100 text-orange-500'}`}>
                <i className={n.icon ?? 'ri-notification-3-line'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs leading-relaxed truncate ${n.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                  {n.message}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(n.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {!n.is_read && <span className="w-2 h-2 bg-orange-500 rounded-full shrink-0 mt-1.5" />}
            </button>
          ))
        )}
      </div>

      <div className="px-4 py-2 border-t border-gray-100">
        <button
          onClick={onClose}
          className="w-full text-center text-xs text-orange-500 hover:underline py-1"
        >
          View all notifications →
        </button>
      </div>
    </div>
  );
};

// ─── Profile dropdown ────────────────────────────────────────
const ProfileDropdown = ({ user, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch { /* silent */ } finally {
      logout();
      navigate('/');
      toast.success('Logged out successfully');
    }
  };

  const menuItems = [
    { icon: 'ri-user-line',         label: 'My Profile',      action: () => navigate('/profile') },
    { icon: 'ri-settings-3-line',   label: 'Settings',        action: () => navigate('/settings') },
    { icon: 'ri-shield-user-line',  label: 'Change Password', action: () => navigate('/settings/password') },
  ];

  return (
    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
      {/* User info */}
      <div className="px-4 py-3 bg-gradient-to-br from-orange-50 to-amber-50 border-b border-orange-100">
        <div className="flex items-center gap-3">
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=f97316&color=fff&size=40`}
            className="w-10 h-10 rounded-full object-cover border-2 border-orange-200"
            alt={user?.name}
          />
          <div>
            <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate max-w-[120px]">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="py-1.5">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => { item.action(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <i className={`${item.icon} text-gray-400`} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="border-t border-gray-100 py-1.5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          <i className="ri-logout-box-r-line" />
          Logout
        </button>
      </div>
    </div>
  );
};

// ─── Main Navbar ─────────────────────────────────────────────
const Navbar = ({ sidebarCollapsed, onToggleSidebar }) => {
  const { user } = useAuth();
  const [darkMode, setDarkMode]             = useState(() => localStorage.getItem('theme') === 'dark');
  const [notifOpen, setNotifOpen]           = useState(false);
  const [profileOpen, setProfileOpen]       = useState(false);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [today, setToday]                   = useState('');

  const notifRef   = useRef(null);
  const profileRef = useRef(null);

  // Today's date
  useEffect(() => {
    setToday(new Date().toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    }));
  }, []);

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Notification count poll
  const fetchUnread = useCallback(async () => {
    try {
      const { data } = await api.get('/api/notifications/unread-count');
      setUnreadCount(data.count ?? 0);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, 30_000);
    return () => clearInterval(id);
  }, [fetchUnread]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const roleStyle = ROLE_STYLES[user?.role] ?? ROLE_STYLES.employee;

  return (
    <header className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-100 shadow-sm
      flex items-center px-5 gap-4 z-30 transition-all duration-300
      ${sidebarCollapsed ? 'left-16' : 'left-60'}`}
    >
      {/* Sidebar toggle (mobile fallback) */}
      <button
        onClick={onToggleSidebar}
        className="text-gray-400 hover:text-gray-700 transition-colors lg:hidden"
      >
        <i className="ri-layout-left-line text-xl" />
      </button>

      {/* Welcome + date */}
      <div className="flex-1">
        <h1 className="text-base font-bold text-gray-900 leading-tight">
          Welcome, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-xs text-gray-400">Today is {today}</p>
      </div>

      {/* ── Right controls ── */}
      <div className="flex items-center gap-1.5">

        {/* Role badge */}
        <span className={`hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${roleStyle}`}>
          {ROLE_LABELS[user?.role]}
        </span>

        {/* Profile button */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-gray-200
              hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-150"
          >
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=f97316&color=fff&size=32`}
              alt={user?.name}
              className="w-7 h-7 rounded-full object-cover"
            />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-gray-900 leading-tight max-w-[90px] truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-400 capitalize leading-tight">{user?.role?.replace('_', ' ')}</p>
            </div>
            <i className={`ri-arrow-down-s-line text-gray-400 text-sm transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>
          {profileOpen && <ProfileDropdown user={user} onClose={() => setProfileOpen(false)} />}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Language */}
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-xs font-semibold text-gray-600">
          EN
        </button>

        {/* Dark mode */}
        <button
          onClick={() => setDarkMode((d) => !d)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          title="Toggle dark mode"
        >
          <i className={`${darkMode ? 'ri-sun-line text-amber-500' : 'ri-moon-line text-gray-500'} text-base`} />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false); }}
            className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            title="Notifications"
          >
            <i className="ri-notification-3-line text-gray-500 text-base" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-red-500 text-white
                text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
        </div>

        {/* Logout */}
        <button
          onClick={async () => {
            const { logout } = useAuth();
            try { await api.post('/api/auth/logout'); } catch {}
            logout();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600
            text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <i className="ri-logout-box-r-line" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
