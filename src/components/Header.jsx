import React, { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import NotificationPopup from "./NotificationPopup";
import api from "../services/api";

const Header = () => {
  const date = new Date();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { i18n } = useTranslation();

  const [showNotif, setShowNotif]         = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const bellRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications?limit=10");
      const list = data.data || [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !(n.isRead ?? n.read)).length);
    } catch { /* silent — user may not have notifications yet */ }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close popup on outside click
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const toggleLang = () => {
    const next = i18n.language === "en" ? "hi" : "en";
    i18n.changeLanguage(next);
  };

  const displayName = user?.firstName || user?.username || user?.email?.split("@")[0] || "User";
  const role = user?.role || "employee";

  const roleBadgeColor = {
    admin:      "bg-blue-100 text-blue-800",
    hr:         "bg-purple-100 text-purple-800",
    employee:   "bg-green-100 text-green-800",
    superadmin: "bg-red-100 text-red-800",
  };
  const badgeClass = roleBadgeColor[role.toLowerCase()] || "bg-gray-100 text-gray-700";

  return (
    <div className="w-full">
      <div className="w-full h-15 flex items-center justify-between p-5 bg-white dark:bg-gray-900 border-b-2 border-gray-300 dark:border-gray-700">
        <div>
          <p className="text-2xl font-bold truncate max-w-[200px] sm:max-w-none dark:text-white">
            Welcome, {displayName}!
          </p>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Today is {date.toDateString()}</p>
        </div>

        <div className="flex gap-2 items-center">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full hidden sm:inline ${badgeClass}`}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>

          {/* Profile avatar — click to go to /profile */}
          <div
            className="border-2 border-gray-300 dark:border-gray-600 flex h-12 w-auto rounded-2xl items-center px-2 gap-2 dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            onClick={() => navigate("/profile")}
            title="View Profile"
          >
            <img
              src="src/assets/imgs/profile_pic.jpg"
              className="h-8 w-8 rounded-full border object-cover"
              alt="profile"
            />
            <div className="hidden sm:block mr-1">
              <p className="font-bold text-sm leading-tight dark:text-white">{displayName}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">{role}</p>
            </div>
          </div>

          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
            title="Toggle Language"
          >
            {i18n.language === "en" ? "हि" : "EN"}
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title="Toggle Dark Mode"
          >
            <i className={`text-xl ${isDark ? "ri-sun-line text-yellow-400" : "ri-moon-line text-gray-600"}`}></i>
          </button>

          {/* Notification bell with popup */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => setShowNotif(prev => !prev)}
              className="relative p-2.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              aria-label="Notifications"
            >
              <i className="ri-notification-line font-bold text-xl dark:text-gray-300"></i>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {showNotif && (
              <NotificationPopup
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAllRead={markAllRead}
                onClose={() => setShowNotif(false)}
                onRefresh={fetchNotifications}
              />
            )}
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition flex items-center gap-1"
          >
            <i className="ri-logout-box-r-line"></i>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
        <Outlet />
      </div>
    </div>
  );
};

export default Header;
