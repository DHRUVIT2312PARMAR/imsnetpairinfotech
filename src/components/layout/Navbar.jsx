// src/components/layout/Navbar.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeLang } from '../../context/ThemeLanguageContext';
import { toast } from 'react-toastify';
import api from '../../services/api';

// Outside click hook
const useOutsideClick = (callback) => {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) callback();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [callback]);
  return ref;
};

// Notifications hook
const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications?limit=15');
      setNotifications(data.data ?? []);
      setUnreadCount((data.data ?? []).filter((n) => !n.isRead).length);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markRead = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silent
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  }, []);

  return { notifications, unreadCount, loading, markRead, markAllRead };
};

// Notification Panel
const NotificationPanel = ({ onClose }) => {
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <i className="ri-notification-3-fill text-orange-500" />
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-orange-500 hover:underline font-medium">
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="px-4 py-3 flex gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-2/5" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <i className="ri-notification-off-line text-4xl block mb-2" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n._id}
              onClick={() => markRead(n._id)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-100 dark:border-gray-800 ${
                n.isRead ? 'hover:bg-gray-50 dark:hover:bg-gray-800' : 'bg-orange-50/60 dark:bg-orange-900/10'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                n.isRead ? 'bg-gray-200 text-gray-400' : 'bg-gradient-to-br from-orange-400 to-amber-400 text-white'
              }`}>
                <i className={n.icon ?? 'ri-notification-3-line'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs leading-relaxed ${n.isRead ? 'text-gray-500' : 'text-gray-900 dark:text-white font-medium'}`}>
                  {n.message}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleDateString()}
                </p>
              </div>
              {!n.isRead && <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2" />}
            </button>
          ))
        )}
      </div>

      <button onClick={onClose} className="w-full py-2.5 text-xs font-medium text-orange-500 border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
        View all →
      </button>
    </div>
  );
};

// Theme Toggle
const ThemeToggle = () => {
  const { isDark, toggleTheme } = useThemeLang();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-12 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center px-0.5 transition-colors"
    >
      <span className="absolute left-1.5 text-[10px]">☀️</span>
      <span className="absolute right-1.5 text-[10px]">🌙</span>
      <span className={`relative z-10 w-5 h-5 rounded-full bg-white dark:bg-gray-900 shadow-sm flex items-center justify-center text-[10px] transition-transform ${
        isDark ? 'translate-x-6' : 'translate-x-0'
      }`}>
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  );
};

// Profile Dropdown
const ProfileDropdown = ({ user, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // silent
    } finally {
      logout();
      navigate('/');
      toast.success('Logged out successfully');
    }
  };

  const menuItems = [
    { icon: 'ri-user-line', label: 'My Profile', path: '/profile' },
    { icon: 'ri-settings-3-line', label: 'Settings', path: '/settings' },
    { icon: 'ri-lock-password-line', label: 'Change Password', path: '/settings/password' },
  ];

  const userName = `${user?.firstName} ${user?.lastName}`;
  const userAvatar = user?.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=f97316&color=fff&size=48`;

  return (
    <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={userAvatar} alt={userName} className="w-12 h-12 rounded-xl object-cover ring-2 ring-orange-200" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{userName}</p>
            <p className="text-xs text-gray-500 truncate">{user?.systemEmail}</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="py-1.5">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              navigate(item.path);
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <i className={`${item.icon} text-gray-400`} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="border-t border-gray-200 dark:border-gray-800 py-1.5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <i className="ri-logout-box-r-line" />
          Logout
        </button>
      </div>
    </div>
  );
};

// Main Navbar
const Navbar = ({ sidebarCollapsed }) => {
  const { user } = useAuth();
  const { isDark } = useThemeLang();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [today, setToday] = useState('');

  const { unreadCount } = useNotifications();

  useEffect(() => {
    const updateDate = () => {
      setToday(new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }));
    };
    updateDate();
    const timeout = setTimeout(updateDate, new Date().setHours(24, 0, 0, 0) - Date.now());
    return () => clearTimeout(timeout);
  }, []);

  const notifRef = useOutsideClick(useCallback(() => setNotifOpen(false), []));
  const profileRef = useOutsideClick(useCallback(() => setProfileOpen(false), []));

  const userName = `${user?.firstName} ${user?.lastName}`;
  const userAvatar = user?.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=f97316&color=fff&size=32`;

  const roleStyles = {
    superAdmin: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    admin: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    hr: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    employee: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  };

  const roleLabels = {
    superAdmin: 'Super Admin',
    admin: 'Admin',
    hr: 'HR',
    employee: 'Employee',
  };

  return (
    <header
      className={`
        fixed top-0 right-0 h-16 z-30
        bg-white/95 dark:bg-gray-950/95 backdrop-blur-md
        border-b border-gray-200 dark:border-gray-800
        shadow-sm flex items-center px-4 gap-3
        transition-all duration-300
        ${sidebarCollapsed ? 'left-16' : 'left-60'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
          <img src="/logo1.png" alt="NP" className="w-8 h-8 object-contain" />
        </div>
        <div>
          <p className="text-xs font-black text-gray-900 dark:text-white leading-tight">Netpair</p>
          <p className="text-[8px] font-bold text-orange-500 uppercase tracking-wider leading-tight">Infotech</p>
        </div>
      </div>

      <div className="w-px h-7 bg-gray-200 dark:bg-gray-800" />

      {/* Welcome */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate">
          Welcome, <span className="text-orange-500">{user?.firstName}!</span>
        </h1>
        <p className="text-[10px] text-gray-400">Today is {today}</p>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Role badge */}
        <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${roleStyles[user?.role] || roleStyles.employee}`}>
          {roleLabels[user?.role] || 'Employee'}
        </span>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-0.5 pr-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/10"
          >
            <div className="relative">
              <img src={userAvatar} alt={userName} className="w-7 h-7 rounded-full object-cover" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-950" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold truncate max-w-[80px]">{user?.firstName}</p>
              <p className="text-[9px] text-gray-400 capitalize">{roleLabels[user?.role]}</p>
            </div>
            <i className={`ri-arrow-down-s-line text-sm text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>
          {profileOpen && <ProfileDropdown user={user} onClose={() => setProfileOpen(false)} />}
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <i className={`ri-notification-3-line text-lg ${notifOpen ? 'text-orange-500' : 'text-gray-500'}`} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
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
