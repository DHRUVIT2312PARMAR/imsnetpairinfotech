import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";

const typeStyle = (t) => ({
  leave:        { bg: "bg-blue-100",   text: "text-blue-700",   icon: "ri-survey-line" },
  attendance:   { bg: "bg-green-100",  text: "text-green-700",  icon: "ri-calendar-check-line" },
  announcement: { bg: "bg-purple-100", text: "text-purple-700", icon: "ri-megaphone-line" },
  task:         { bg: "bg-yellow-100", text: "text-yellow-700", icon: "ri-task-line" },
  system:       { bg: "bg-gray-100",   text: "text-gray-600",   icon: "ri-settings-line" },
}[(t||"").toLowerCase()] || { bg: "bg-gray-100", text: "text-gray-600", icon: "ri-notification-line" });

const Notifications = () => {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/notifications?limit=50");
      setItems(data.data || []);
    } catch { toast.error("Failed to load notifications"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const unreadCount = items.filter(n => !(n.isRead ?? n.read)).length;

  const filtered = items.filter(n =>
    filter === "All" || (n.type || "").toLowerCase() === filter.toLowerCase()
  );

  const markRead = async (id) => {
    setItems(prev => prev.map(n => n._id === id ? { ...n, isRead: true, read: true } : n));
    try { await api.patch(`/notifications/${id}/read`); } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setItems(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
      toast.success("All marked as read");
    } catch { toast.error("Failed"); }
  };

  const deleteNotif = async (id) => {
    setItems(prev => prev.filter(n => n._id !== id));
    try { await api.delete(`/notifications/${id}`); } catch { /* silent */ }
    toast.success("Notification removed");
  };

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Notifications</h1>
          {unreadCount > 0 && <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition text-sm">
            <i className="ri-check-double-line"></i> Mark all as read
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "All",    count: items.length,                                                    color: "from-blue-500 to-indigo-600",   icon: "ri-notification-line" },
          { label: "Unread", count: unreadCount,                                                     color: "from-yellow-500 to-orange-500", icon: "ri-mail-unread-line" },
          { label: "Leave",  count: items.filter(n => (n.type||"").toLowerCase() === "leave").length, color: "from-green-500 to-emerald-600", icon: "ri-survey-line" },
          { label: "System", count: items.filter(n => (n.type||"").toLowerCase() === "system").length,color: "from-gray-500 to-slate-600",    icon: "ri-settings-line" },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-5 text-white bg-gradient-to-r ${s.color} shadow-lg hover:shadow-2xl transition hover:-translate-y-1`}>
            <div className="flex justify-between items-center">
              <div><p className="text-xs opacity-90">{s.label}</p><h2 className="text-2xl font-bold mt-1">{s.count}</h2></div>
              <div className="bg-white/20 p-2.5 rounded-xl text-xl"><i className={s.icon}></i></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-2">
        {["All", "Leave", "Attendance", "Announcement", "Task", "System"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {loading ? Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start gap-4 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0"></div>
            <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div><div className="h-3 bg-gray-200 rounded w-full"></div></div>
          </div>
        )) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
            <i className="ri-notification-off-line text-4xl mb-2 block"></i>
            <p className="text-sm">No notifications</p>
          </div>
        ) : filtered.map(n => {
          const isRead = n.isRead ?? n.read;
          const style  = typeStyle(n.type);
          return (
            <div key={n._id} onClick={() => markRead(n._id)}
              className={`bg-white rounded-2xl border shadow-sm p-4 flex items-start gap-4 cursor-pointer transition hover:shadow-md ${isRead ? "border-gray-200" : "border-blue-200 bg-blue-50/30"}`}>
              <div className={`${style.bg} ${style.text} p-3 rounded-xl text-xl flex-shrink-0`}>
                <i className={style.icon}></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-semibold ${isRead ? "text-gray-800" : "text-gray-900"}`}>{n.title}</p>
                  {!isRead && <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.bg} ${style.text}`}>{n.type}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{n.message || n.desc}</p>
                <p className="text-[11px] text-gray-400 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString("en-IN") : n.time}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteNotif(n._id); }}
                className="text-gray-300 hover:text-red-500 transition flex-shrink-0 p-1">
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Notifications;
