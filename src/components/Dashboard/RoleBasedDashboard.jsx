import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import AdminDashboard    from "./AdminDashboard";
import HRDashboard       from "./HRDashboard";
import EmployeeDashboard from "./EmployeeDashboard";

// SuperAdmin dashboard — primary (view+approve) or advanced (full CRUD)
const SuperAdminDashboard = () => {
  const [mode, setMode] = useState("primary");

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">SuperAdmin Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {mode === "primary" ? "Approval mode — view all + approve/reject" : "Advanced mode — full CRUD enabled"}
          </p>
        </div>

        {/* Primary ↔ Advanced toggle */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {mode === "primary" ? "Approval Mode" : "Advanced Mode"}
          </span>
          <button
            onClick={() => setMode(m => m === "primary" ? "advanced" : "primary")}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              mode === "advanced" ? "bg-red-500" : "bg-blue-500"
            }`}
            aria-label="Toggle SuperAdmin mode"
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              mode === "advanced" ? "translate-x-7" : "translate-x-1"
            }`} />
          </button>
          {mode === "advanced" && (
            <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded-full">
              ⚠ Advanced — Full edit access
            </span>
          )}
        </div>
      </div>

      {/* Mode info banner */}
      {mode === "primary" ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <i className="ri-shield-check-line text-blue-600 text-xl mt-0.5"></i>
          <div>
            <p className="text-sm font-semibold text-blue-800">Primary Mode — Approvals Only</p>
            <p className="text-xs text-blue-600 mt-0.5">
              You can view all data and approve/reject requests. Switch to Advanced mode to create, edit, or delete records.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <i className="ri-alert-line text-red-500 text-xl mt-0.5"></i>
          <div>
            <p className="text-sm font-semibold text-red-800">Advanced Mode — Full CRUD Enabled</p>
            <p className="text-xs text-red-600 mt-0.5">
              You have full create, edit, and delete access across all modules. Use with caution.
            </p>
          </div>
        </div>
      )}

      {/* Approval Queue — primary mode */}
      {mode === "primary" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Pending Policy Approvals", count: 3, icon: "ri-file-list-line", color: "from-orange-500 to-amber-500" },
            { label: "System Config Requests",   count: 1, icon: "ri-settings-4-line", color: "from-purple-500 to-indigo-600" },
            { label: "Critical Operations",      count: 2, icon: "ri-alert-line",      color: "from-red-500 to-rose-600" },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                <i className={`${item.icon} text-white text-xl`}></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{item.count}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Advanced mode — show full admin dashboard */}
      {mode === "advanced" && <AdminDashboard advancedMode />}

      {/* System overview — always visible */}
      {mode === "primary" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <p className="text-base font-semibold text-gray-800 mb-4">Pending Approvals</p>
            <div className="flex flex-col gap-3">
              {[
                { title: "Leave Policy Update",       by: "Admin — Mitesh Patel",   type: "Policy",   status: "pending" },
                { title: "New Salary Structure",      by: "HR — Rohit Prajapati",   type: "Payroll",  status: "pending" },
                { title: "System Config Change",      by: "Admin — Mitesh Patel",   type: "System",   status: "pending" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.by}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{item.type}</span>
                    <button className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg transition">Approve</button>
                    <button className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg transition">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <p className="text-base font-semibold text-gray-800 mb-4">System Health</p>
            <div className="flex flex-col gap-3">
              {[
                { label: "Database",       status: "Healthy",     color: "text-green-600 bg-green-50" },
                { label: "Email Service",  status: "Operational", color: "text-green-600 bg-green-50" },
                { label: "Auth Service",   status: "Operational", color: "text-green-600 bg-green-50" },
                { label: "Socket.IO",      status: "Active",      color: "text-blue-600 bg-blue-50" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-700">{item.label}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Routes to the correct dashboard based on user role
const RoleBasedDashboard = () => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() || "employee";

  if (role === "superadmin") return <SuperAdminDashboard />;
  if (role === "admin")      return <AdminDashboard />;
  if (role === "hr")         return <HRDashboard />;
  return <EmployeeDashboard />;
};

export default RoleBasedDashboard;
