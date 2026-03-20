import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import BarCharts from "../Charts/BarCharts";
import PieChartSimple from "../Charts/PieChartSimple";
import Card from "./Card";
import Table from "./Table";
import useApi from "../../hooks/useApi";
import api from "../../services/api";

const recentActivity = [
  { initials: "RP", name: "Rohit Prajapati", action: "Clocked in at 09:14 AM",      time: "2 min ago",  bg: "#eff4ff", color: "#1a3fb5" },
  { initials: "AS", name: "Amit Shah",        action: "Applied for Casual Leave",     time: "15 min ago", bg: "#f0fdf4", color: "#16a34a" },
  { initials: "NP", name: "Neha Patel",       action: "New employee onboarded",       time: "1 hr ago",   bg: "#faf5ff", color: "#9333ea" },
  { initials: "KJ", name: "Karan Joshi",      action: "Project 'NetPair v2' updated", time: "2 hr ago",   bg: "#fffbeb", color: "#d97706" },
  { initials: "PS", name: "Priya Shah",       action: "Payroll processed for March",  time: "3 hr ago",   bg: "#fff1f2", color: "#e11d48" },
];

const upcomingEvents = [
  { day: "20", month: "MAR", title: "Team Standup",     sub: "10:00 AM — Conference Room A" },
  { day: "22", month: "MAR", title: "Sprint Review",    sub: "3:00 PM — Online" },
  { day: "25", month: "MAR", title: "HR Policy Update", sub: "11:00 AM — HR Dept" },
];

const AdminDashboard = ({ advancedMode = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role?.toLowerCase() || "admin";

  const fetchStats = useCallback(() =>
    api.get("/attendance/dashboard-stats").then(r => r.data.data), []);

  const { data: liveStats, loading: statsLoading } = useApi(fetchStats, [], 60000);

  const stats = [
    { icon: "ri-team-line",        num: statsLoading ? "—" : (liveStats?.totalEmployees ?? "—"), tot: "Total Employees",   color: "from-blue-500 to-indigo-600" },
    { icon: "ri-user-follow-line", num: statsLoading ? "—" : (liveStats?.presentToday    ?? "—"), tot: "Present Today",     color: "from-green-500 to-emerald-600" },
    { icon: "ri-folder-line",      num: 8,                                                         tot: "Active Projects",   color: "from-purple-500 to-pink-600" },
    { icon: "ri-shield-user-line", num: statsLoading ? "—" : (liveStats?.onLeave         ?? "—"), tot: "On Leave Today",    color: "from-orange-500 to-red-500" },
  ];

  // v2.1: Admin quick actions — no projects/assets/payroll (those are HR)
  const quickActions = [
    { label: "Add Employee",    icon: "ri-user-add-line",       path: "/employee/registration" },
    { label: "View Reports",    icon: "ri-bar-chart-line",      path: "/reports" },
    { label: "Role Management", icon: "ri-shield-user-line",    path: "/role-management" },
    { label: "Inventory",       icon: "ri-store-line",          path: "/inventory" },
    { label: "Announcements",   icon: "ri-megaphone-line",      path: "/announcements" },
    { label: "Policies",        icon: "ri-file-list-line",      path: "/policies" },
    // SuperAdmin advanced mode extras
    ...(advancedMode ? [
      { label: "Audit Logs",    icon: "ri-file-history-line",   path: "/audit-logs" },
      { label: "System Config", icon: "ri-settings-4-line",     path: "/system-configuration" },
    ] : []),
  ];

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{advancedMode ? "System Overview" : "Admin Dashboard"}</h1>
          <p className="text-xs text-gray-500 mt-0.5">System overview — {new Date().toDateString()}</p>
        </div>
        <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium capitalize">{advancedMode ? "superadmin" : role}</span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, i) => <Card key={i} icon={s.icon} num={s.num} tot={s.tot} color={s.color} />)}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <p className="text-base font-semibold text-gray-800 mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((a, i) => (
            <button key={i} onClick={() => navigate(a.path)}
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm px-4 py-2 rounded-lg transition">
              <i className={`${a.icon} text-base`}></i>{a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <BarCharts />
        <PieChartSimple completed={18} progress={10} assigned={6} overdue={3} />
      </div>

      {/* Activity + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <p className="text-base font-semibold text-gray-800 mb-1">Recent Activity</p>
          <p className="text-xs text-gray-500 mb-4">Latest actions across the system</p>
          <div className="flex flex-col divide-y divide-gray-100">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex gap-3 items-start py-3">
                <div className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ background: item.bg, color: item.color }}>{item.initials}</div>
                <div>
                  <p className="text-xs font-bold text-gray-800 leading-tight">{item.name}</p>
                  <p className="text-xs text-gray-500 leading-tight">{item.action}</p>
                  <p className="text-xs text-gray-400 leading-tight">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <p className="text-base font-semibold text-gray-800 mb-1">Upcoming Events</p>
          <p className="text-xs text-gray-500 mb-4">Scheduled for this week</p>
          <div className="flex flex-col gap-3">
            {upcomingEvents.map((ev, i) => (
              <div key={i} className="flex gap-3 items-start p-3 rounded-lg" style={{ background: "#eff4ff" }}>
                <div className="w-9 h-9 rounded flex-shrink-0 flex flex-col items-center justify-center text-white"
                  style={{ background: "#1a3fb5" }}>
                  <span className="text-sm font-bold leading-none">{ev.day}</span>
                  <span className="text-[8px] leading-none">{ev.month}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800 leading-tight">{ev.title}</p>
                  <p className="text-xs text-gray-500 leading-tight">{ev.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-2 w-full">
        <Table />
      </div>
    </div>
  );
};

export default AdminDashboard;
