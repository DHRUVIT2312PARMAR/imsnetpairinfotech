import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";

const onboardingChecklist = [
  "Offer letter signed", "ID proof submitted", "Bank details collected",
  "Laptop assigned", "Email account created", "System access granted",
  "Induction completed", "Team introduction done",
];

const HRManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState("onboarding");
  const [deptStats, setDeptStats] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/employees?limit=200&sortBy=joiningDate&order=desc");
      const list = data.data?.data || [];
      // Add onboarding checks state (stored locally — no backend for checklist yet)
      const withChecks = list.map(e => ({
        ...e,
        checks: Array(8).fill(false),
      }));
      setEmployees(withChecks);

      // Build department stats from employee list
      const deptMap = {};
      list.forEach(e => {
        if (!deptMap[e.department]) deptMap[e.department] = { name: e.department, count: 0 };
        deptMap[e.department].count++;
      });
      setDeptStats(Object.values(deptMap));
    } catch { toast.error("Failed to load employees"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleCheck = (empId, idx) => {
    setEmployees(prev => prev.map(e => {
      if (e._id !== empId) return e;
      const checks = [...e.checks];
      checks[idx] = !checks[idx];
      return { ...e, checks };
    }));
    toast.success("Checklist updated");
  };

  // Employees joined in last 30 days = onboarding
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const onboarding = employees.filter(e => new Date(e.joiningDate) >= thirtyDaysAgo);
  const openPositions = deptStats.reduce((s, d) => s + (d.count < 5 ? 1 : 0), 0);

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <h1 className="text-2xl font-semibold">HR Management</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Employees", value: employees.length,   color: "from-blue-500 to-indigo-600",   icon: "ri-team-line" },
          { label: "Onboarding",      value: onboarding.length,  color: "from-yellow-500 to-orange-500", icon: "ri-user-add-line" },
          { label: "Departments",     value: deptStats.length,   color: "from-purple-500 to-violet-600", icon: "ri-building-line" },
          { label: "Open Positions",  value: openPositions,      color: "from-green-500 to-emerald-600", icon: "ri-briefcase-line" },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-5 text-white bg-gradient-to-r ${s.color} shadow-lg hover:shadow-2xl transition hover:-translate-y-1`}>
            <div className="flex justify-between items-center">
              <div><p className="text-xs opacity-90">{s.label}</p><h2 className="text-2xl font-bold mt-1">{s.value}</h2></div>
              <div className="bg-white/20 p-2.5 rounded-xl text-xl"><i className={s.icon}></i></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {[{ key: "onboarding", label: "Onboarding" }, { key: "departments", label: "Departments" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "onboarding" && (
        <div className="flex flex-col gap-4">
          {loading ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div><div className="h-3 bg-gray-200 rounded w-1/4"></div></div>
              </div>
              <div className="h-2 bg-gray-200 rounded w-full mb-3"></div>
            </div>
          )) : onboarding.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
              <i className="ri-user-add-line text-4xl mb-2 block"></i>
              <p className="text-sm">No employees joined in the last 30 days</p>
            </div>
          ) : onboarding.map(emp => (
            <div key={emp._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: "#eff4ff", color: "#1a3fb5" }}>
                    {(emp.firstName || "?").charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs text-gray-400">{emp.department} · Joined {new Date(emp.joiningDate).toLocaleDateString("en-IN")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{emp.checks.filter(Boolean).length}/{emp.checks.length} done</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${emp.checks.every(Boolean) ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {emp.checks.every(Boolean) ? "Active" : "Onboarding"}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                <div className="bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${(emp.checks.filter(Boolean).length / emp.checks.length) * 100}%` }}></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {onboardingChecklist.map((item, idx) => (
                  <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={emp.checks[idx]} onChange={() => toggleCheck(emp._id, idx)}
                      className="w-4 h-4 accent-blue-600 cursor-pointer" />
                    <span className={`text-xs ${emp.checks[idx] ? "text-gray-400 line-through" : "text-gray-700"} group-hover:text-blue-600 transition`}>{item}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "departments" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            </div>
          )) : deptStats.length === 0 ? (
            <div className="col-span-3 bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
              <i className="ri-building-line text-4xl mb-2 block"></i>
              <p className="text-sm">No department data yet</p>
            </div>
          ) : deptStats.map((d, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl"><i className="ri-building-line text-lg"></i></div>
                <h3 className="font-semibold text-sm">{d.name}</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Headcount</span><span className="font-medium">{d.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HRManagement;
