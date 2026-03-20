import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const myTasks = [
  { title: "Fix login bug",          project: "NetPair v2",  priority: "High",   status: "In Progress" },
  { title: "Update dashboard UI",    project: "NetPair v2",  priority: "Medium", status: "Pending" },
  { title: "Write unit tests",       project: "QA Sprint",   priority: "Low",    status: "Pending" },
];

const priorityColor = (p) => ({ High: "bg-red-100 text-red-700", Medium: "bg-yellow-100 text-yellow-700", Low: "bg-green-100 text-green-700" }[p]);
const statusColor   = (s) => ({ "In Progress": "bg-blue-100 text-blue-700", Pending: "bg-gray-100 text-gray-600", Done: "bg-green-100 text-green-700" }[s]);

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const leaveBalance = [
    { type: "Casual",    used: 2, total: 6,  color: "bg-blue-500" },
    { type: "Sick",      used: 1, total: 8,  color: "bg-green-500" },
    { type: "Emergency", used: 0, total: 4,  color: "bg-orange-500" },
  ];

  const quickActions = [
    { label: "Mark Attendance", icon: "ri-calendar-check-line", path: "/attendance" },
    { label: "Apply Leave",     icon: "ri-survey-line",         path: "/leave" },
    { label: "My Tasks",        icon: "ri-task-line",           path: "/tasktimesheet" },
    { label: "WFH Request",     icon: "ri-home-office-line",    path: "/wfh" },
    { label: "Helpdesk",        icon: "ri-customer-service-line",path: "/helpdesk" },
    { label: "Announcements",   icon: "ri-megaphone-line",      path: "/announcements" },
  ];

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">My Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">Welcome back, {user?.username || "Employee"} — {new Date().toDateString()}</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Employee</span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: "ri-calendar-check-line", num: 18, tot: "Days Present",    color: "from-green-500 to-emerald-600" },
          { icon: "ri-survey-line",         num: 3,  tot: "Leaves Used",     color: "from-yellow-500 to-orange-500" },
          { icon: "ri-task-line",           num: 5,  tot: "Active Tasks",    color: "from-blue-500 to-indigo-600" },
          { icon: "ri-home-office-line",    num: 2,  tot: "WFH This Month",  color: "from-purple-500 to-violet-600" },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-5 text-white bg-gradient-to-r ${s.color} shadow-lg hover:shadow-2xl transition hover:-translate-y-1`}>
            <div className="flex justify-between items-center">
              <div><p className="text-xs opacity-90">{s.tot}</p><h2 className="text-2xl font-bold mt-1">{s.num}</h2></div>
              <div className="bg-white/20 p-2.5 rounded-xl text-xl"><i className={s.icon}></i></div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <p className="text-base font-semibold text-gray-800 mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((a, i) => (
            <button key={i} onClick={() => navigate(a.path)}
              className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 font-medium text-sm px-4 py-2 rounded-lg transition">
              <i className={`${a.icon} text-base`}></i>{a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Leave Balance */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <p className="text-base font-semibold text-gray-800 mb-1">My Leave Balance</p>
          <p className="text-xs text-gray-500 mb-4">Current year remaining</p>
          <div className="flex flex-col gap-4">
            {leaveBalance.map((b, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{b.type}</span>
                  <span className="text-gray-500 text-xs">{b.total - b.used} remaining / {b.total} total</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`${b.color} h-2 rounded-full transition-all`}
                    style={{ width: `${(b.used / b.total) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/leave")}
            className="mt-4 text-xs text-blue-600 hover:underline">Apply for leave →</button>
        </div>

        {/* My Tasks */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <p className="text-base font-semibold text-gray-800 mb-1">My Tasks</p>
          <p className="text-xs text-gray-500 mb-4">Currently assigned to you</p>
          <div className="flex flex-col gap-3">
            {myTasks.map((t, i) => (
              <div key={i} className="flex items-start justify-between gap-2 p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.title}</p>
                  <p className="text-xs text-gray-400">{t.project}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor(t.priority)}`}>{t.priority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(t.status)}`}>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/tasktimesheet")}
            className="mt-3 text-xs text-blue-600 hover:underline">View all tasks →</button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
