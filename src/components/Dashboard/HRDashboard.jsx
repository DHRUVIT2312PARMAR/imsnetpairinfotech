import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "./Card";
import BarCharts from "../Charts/BarCharts";

const pendingLeaves = [
  { name: "Rohit Prajapati", type: "Casual",    days: 3, from: "Mar 20" },
  { name: "Karan Joshi",     type: "Sick",      days: 1, from: "Mar 21" },
  { name: "Priya Mehta",     type: "Emergency", days: 2, from: "Mar 22" },
];

const HRDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { icon: "ri-team-line",           num: 40, tot: "Total Employees",  color: "from-blue-500 to-indigo-600" },
    { icon: "ri-user-follow-line",    num: 32, tot: "Present Today",    color: "from-green-500 to-emerald-600" },
    { icon: "ri-survey-line",         num: 5,  tot: "Pending Leaves",   color: "from-yellow-500 to-orange-500" },
    { icon: "ri-money-dollar-circle-line", num: 3, tot: "Payroll Pending", color: "from-purple-500 to-violet-600" },
  ];

  const quickActions = [
    { label: "Add Employee",    icon: "ri-user-add-line",       path: "/employee/registration" },
    { label: "Leave Requests",  icon: "ri-survey-line",         path: "/leave" },
    { label: "Attendance",      icon: "ri-calendar-check-line", path: "/attendance" },
    { label: "Payroll",         icon: "ri-money-dollar-circle-line", path: "/payroll" },
    { label: "HR Management",   icon: "ri-user-settings-line",  path: "/hr-management" },
    { label: "Reports",         icon: "ri-bar-chart-line",      path: "/reports" },
  ];

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">HR Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">HR operations overview — {new Date().toDateString()}</p>
        </div>
        <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">HR</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, i) => <Card key={i} icon={s.icon} num={s.num} tot={s.tot} color={s.color} />)}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <p className="text-base font-semibold text-gray-800 mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((a, i) => (
            <button key={i} onClick={() => navigate(a.path)}
              className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium text-sm px-4 py-2 rounded-lg transition">
              <i className={`${a.icon} text-base`}></i>{a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BarCharts />

        {/* Pending Leave Requests */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <p className="text-base font-semibold text-gray-800 mb-1">Pending Leave Requests</p>
          <p className="text-xs text-gray-500 mb-4">Awaiting your approval</p>
          <div className="flex flex-col gap-3">
            {pendingLeaves.map((l, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{l.name}</p>
                  <p className="text-xs text-gray-500">{l.type} · {l.days} day{l.days > 1 ? "s" : ""} from {l.from}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate("/leave")} className="p-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 text-sm">
                    <i className="ri-check-line"></i>
                  </button>
                  <button onClick={() => navigate("/leave")} className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 text-sm">
                    <i className="ri-close-line"></i>
                  </button>
                </div>
              </div>
            ))}
            <button onClick={() => navigate("/leave")}
              className="text-xs text-blue-600 hover:underline text-center mt-1">View all leave requests →</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
