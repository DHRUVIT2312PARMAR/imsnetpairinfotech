import React from "react";
import api from "../services/api";

const NOTIF_ICONS = {
  leave:        { bg: "bg-green-100",  icon: "ri-calendar-check-line", color: "text-green-600"  },
  attendance:   { bg: "bg-blue-100",   icon: "ri-time-line",           color: "text-blue-600"   },
  task:         { bg: "bg-purple-100", icon: "ri-task-line",           color: "text-purple-600" },
  payroll:      { bg: "bg-yellow-100", icon: "ri-money-dollar-circle-line", color: "text-yellow-600" },
  policy:       { bg: "bg-orange-100", icon: "ri-file-list-line",      color: "text-orange-600" },
  system:       { bg: "bg-gray-100",   icon: "ri-settings-4-line",     color: "text-gray-600"   },
  announcement: { bg: "bg-pink-100",   icon: "ri-megaphone-line",      color: "text-pink-600"   },
  Leave:        { bg: "bg-green-100",  icon: "ri-calendar-check-line", color: "text-green-600"  },
  Attendance:   { bg: "bg-blue-100",   icon: "ri-time-line",           color: "text-blue-600"   },
  Task:         { bg: "bg-purple-100", icon: "ri-task-line",           color: "text-purple-600" },
  Payroll:      { bg: "bg-yellow-100", icon: "ri-money-dollar-circle-line", color: "text-yellow-600" },
  System:       { bg: "bg-gray-100",   icon: "ri-settings-4-line",     color: "text-gray-600"   },
  Announcement: { bg: "bg-pink-100",   icon: "ri-megaphone-line",      color: "text-pink-600"   },
  default:      { bg: "bg-gray-100",   icon: "ri-notification-line",   color: "text-gray-600"   },
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const NotificationPopup = ({ notifications, unreadCount, onMarkAllRead, onClose, onRefresh }) => {
  const markOneRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      onRefresh();
    } catch { /* silent */ }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={onMarkAllRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-10 text-center">
            <i className="ri-notification-line text-3xl text-gray-300 block mb-2"></i>
            <p className="text-sm text-gray-400">No notifications yet</p>
          </div>
        ) : (
          notifications.map(notif => {
            const isRead = notif.isRead ?? notif.read ?? false;
            const style  = NOTIF_ICONS[notif.type] || NOTIF_ICONS.default;
            return (
              <div
                key={notif._id}
                onClick={() => !isRead && markOneRead(notif._id)}
                className={`flex gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${!isRead ? "bg-blue-50/40" : ""}`}
              >
                <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center ${style.bg}`}>
                  <i className={`${style.icon} ${style.color} text-base`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium leading-snug ${isRead ? "text-gray-600" : "text-gray-800"}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{notif.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
                {!isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0" />}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 text-center">
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 font-medium">
          Close
        </button>
      </div>
    </div>
  );
};

export default NotificationPopup;
