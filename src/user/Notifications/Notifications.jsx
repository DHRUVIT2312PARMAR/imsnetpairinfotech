import React, { useState } from "react";
import { toast } from "react-toastify";

const initialNotifications = [
  { id: 1,  type: "Leave",        title: "Leave request approved",          desc: "Your casual leave for Mar 20 has been approved.",     time: "2 min ago",  read: false },
  { id: 2,  type: "Attendance",   title: "Late arrival recorded",           desc: "Check-in at 10:15 AM — marked as late.",              time: "1 hr ago",   read: false },
  { id: 3,  type: "Announcement", title: "New announcement posted",         desc: "Q1 performance review schedule is now available.",    time: "3 hr ago",   read: false },
  { id: 4,  type: "Task",         title: "Task assigned to you",            desc: "You have been assigned: 'Fix login bug' by Admin.",   time: "5 hr ago",   read: true  },
  { id: 5,  type: "System",       title: "Password changed successfully",   desc: "Your account password was updated.",                  time: "Yesterday",  read: true  },
  { id: 6,  type: "Leave",        title: "Leave request pending",           desc: "Rohit Prajapati applied for 3 days casual leave.",    time: "Yesterday",  read: true  },
  { id: 7,  type: "Attendance",   title: "Attendance marked",               desc: "Today's attendance has been recorded — Present.",     time: "2 days ago", read: true  },
  { id: 8,  type: "System",       title: "System maintenance scheduled",    desc: "Planned downtime on Mar 22 from 2–4 AM.",             time: "2 days ago", read: true  },
];

const typeStyle = (t) => ({
  Leave:        { bg: "bg-blue-100",   text: "text-blue-700",   icon: "ri-survey-line" },
  Attendance:   { bg: "bg-green-100",  text: "text-green-700",  icon: "ri-calendar-check-line" },
  Announcement: { bg: "bg-purple-100", text: "text-purple-700", icon: "ri-megaphone-line" },
  Task:         { bg: "bg-yellow-100", text: "text-yellow-700", icon: "ri-task-line" },
  System:       { bg: "bg-gray-100",   text: "text-gray-600",   icon: "ri-settings-line" },
}[t] || { bg: "bg-gray-100", text: "text-gray-600", icon: "ri-notification-line" });

const Notifications = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems]   = useState(initialNotifications);
  const [filter, setFilter] = useState("All");

  const unreadCount = items.filter(n => !n.read).length;

  const filtered = items.filter(n =>
    filter === "All" || n.type === filter
  );

  const markRead = (id) => setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const markAllRead = () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const deleteNotif = (id) => {
    setItems(prev => prev.filter(n => n.id !== id));
    toast.success("Notification removed");
  };

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition text-sm">
            <i className="ri-check-double-line"></i> Mark all as read
          </button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "All",          count: items.length,                                  color: "from-blue-500 to-indigo-600",   icon: "ri-notification-line" },
          { label: "Unread",       count: items.filter(n => !n.read).length,             color: "from-yellow-500 to-orange-500", icon: "ri-mail-unread-line" },
          { label: "Leave",        count: items.filter(n => n.type === "Leave").length,  color: "from-green-500 to-emerald-600", icon: "ri-survey-line" },
          { label: "System",       count: items.filter(n => n.type === "System").length, color: "from-gray-500 to-slate-600",    icon: "ri-settings-line" },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-5 text-white bg-gradient-to-r ${s.color} shadow-lg hover:shadow-2xl transition hover:-translate-y-1`}>
            <div className="flex justify-between items-center">
              <div><p className="text-xs opacity-90">{s.label}</p><h2 className="text-2xl font-bold mt-1">{s.count}</h2></div>
              <div className="bg-white/20 p-2.5 rounded-xl text-xl"><i className={s.icon}></i></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-2">
        {["All", "Leave", "Attendance", "Announcement", "Task", "System"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start gap-4 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))
        ) : (
        <>
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
            <i className="ri-notification-off-line text-4xl mb-2 block"></i>
            <p className="text-sm">No notifications</p>
          </div>
        )}
        {filtered.map(n => {
          const style = typeStyle(n.type);
          return (
            <div key={n.id} onClick={() => markRead(n.id)}
              className={`bg-white rounded-2xl border shadow-sm p-4 flex items-start gap-4 cursor-pointer transition hover:shadow-md ${n.read ? "border-gray-200" : "border-blue-200 bg-blue-50/30"}`}>
              <div className={`${style.bg} ${style.text} p-3 rounded-xl text-xl flex-shrink-0`}>
                <i className={style.icon}></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-semibold ${n.read ? "text-gray-800" : "text-gray-900"}`}>{n.title}</p>
                  {!n.read && <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.bg} ${style.text}`}>{n.type}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{n.desc}</p>
                <p className="text-[11px] text-gray-400 mt-1">{n.time}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                className="text-gray-300 hover:text-red-500 transition flex-shrink-0 p-1">
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
          );
        })}
        </>
        )}
      </div>
    </div>
  );
};

export default Notifications;
