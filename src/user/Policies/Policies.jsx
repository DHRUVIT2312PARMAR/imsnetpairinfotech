import React, { useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

const initialPolicies = [
  { id: 1, title: "Leave Policy",           category: "HR",      updated: "2026-01-15", desc: "Guidelines for annual, sick, and casual leave entitlements.",      acknowledged: 42, total: 50 },
  { id: 2, title: "Code of Conduct",        category: "General", updated: "2026-02-01", desc: "Expected behavior and professional standards for all employees.",   acknowledged: 48, total: 50 },
  { id: 3, title: "IT Security Policy",     category: "IT",      updated: "2026-01-20", desc: "Rules for device usage, passwords, and data protection.",           acknowledged: 35, total: 50 },
  { id: 4, title: "Expense Reimbursement",  category: "Finance", updated: "2025-12-10", desc: "Process for submitting and approving business expenses.",           acknowledged: 30, total: 50 },
  { id: 5, title: "Remote Work Policy",     category: "HR",      updated: "2026-02-15", desc: "Eligibility and guidelines for work-from-home arrangements.",       acknowledged: 44, total: 50 },
  { id: 6, title: "Data Privacy Policy",    category: "IT",      updated: "2026-01-05", desc: "How employee and client data is collected, stored, and used.",      acknowledged: 38, total: 50 },
  { id: 7, title: "Travel & Accommodation", category: "Finance", updated: "2025-11-20", desc: "Guidelines for business travel bookings and reimbursements.",       acknowledged: 25, total: 50 },
  { id: 8, title: "Anti-Harassment Policy", category: "General", updated: "2026-02-20", desc: "Zero-tolerance policy for workplace harassment and discrimination.", acknowledged: 50, total: 50 },
];

const categoryStyle = (c) => ({
  HR:      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  IT:      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  Finance: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  General: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
}[c] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300");

const emptyForm = { title: "", category: "HR", desc: "" };

const Policies = () => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() || "employee";
  const canManage = ["admin", "superadmin"].includes(role);

  const [policies, setPolicies] = useState(initialPolicies);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("All");
  const [open, setOpen]         = useState(false);
  const [form, setForm]         = useState(emptyForm);

  const filtered = policies.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) &&
    (filter === "All" || p.category === filter)
  );

  const handleAdd = () => {
    if (!form.title || !form.desc) return toast.error("Fill all required fields");
    setPolicies(prev => [{
      id: Date.now(), ...form,
      updated: new Date().toISOString().split("T")[0],
      acknowledged: 0, total: 50,
    }, ...prev]);
    toast.success("Policy added");
    setOpen(false);
    setForm(emptyForm);
  };

  const handleAcknowledge = (id) => {
    setPolicies(prev => prev.map(p =>
      p.id === id ? { ...p, acknowledged: Math.min(p.acknowledged + 1, p.total) } : p
    ));
    toast.success("Policy acknowledged");
  };

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold dark:text-white">Policies</h1>
        {canManage && (
          <button onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition text-sm">
            <i className="ri-add-line"></i> Add Policy
          </button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Policies", value: policies.length,                                       color: "from-blue-500 to-indigo-600",   icon: "ri-file-list-line" },
          { label: "HR",             value: policies.filter(p => p.category === "HR").length,      color: "from-green-500 to-emerald-600", icon: "ri-user-settings-line" },
          { label: "IT",             value: policies.filter(p => p.category === "IT").length,      color: "from-purple-500 to-violet-600", icon: "ri-shield-line" },
          { label: "Finance",        value: policies.filter(p => p.category === "Finance").length, color: "from-yellow-500 to-orange-500", icon: "ri-money-dollar-circle-line" },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-5 text-white bg-gradient-to-r ${s.color} shadow-lg hover:shadow-2xl transition hover:-translate-y-1`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs opacity-90">{s.label}</p>
                <h2 className="text-2xl font-bold mt-1">{s.value}</h2>
              </div>
              <div className="bg-white/20 p-2.5 rounded-xl text-xl"><i className={s.icon}></i></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search policies..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2.5 rounded-lg outline-none focus:border-blue-500 text-sm"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 p-2.5 rounded-lg outline-none text-sm"
        >
          <option value="All">All Categories</option>
          <option>HR</option>
          <option>IT</option>
          <option>Finance</option>
          <option>General</option>
        </select>
        <button
          onClick={() => { setSearch(""); setFilter("All"); }}
          className="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition"
        >
          Reset
        </button>
      </div>

      {/* Policy Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(p => (
          <div key={p.id}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{p.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryStyle(p.category)}`}>{p.category}</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">Updated {p.updated}</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{p.desc}</p>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Acknowledgements</span>
                  <span>{p.acknowledged}/{p.total}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${(p.acknowledged / p.total) * 100}%` }}></div>
                </div>
              </div>
              <button
                onClick={() => handleAcknowledge(p.id)}
                className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-lg font-medium transition flex-shrink-0"
              >
                Acknowledge
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-400 dark:text-gray-500">
            <i className="ri-file-list-line text-4xl mb-2 block"></i>
            <p className="text-sm">No policies found</p>
          </div>
        )}
      </div>

      {/* Add Policy Modal */}
      {open && canManage && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold dark:text-white">Add Policy</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Policy Title *</label>
                <input
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1 text-sm"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Leave Policy"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Category</label>
                <select
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 p-2.5 rounded-lg outline-none mt-1 text-sm"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  <option>HR</option><option>IT</option><option>Finance</option><option>General</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Description *</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1 text-sm resize-none"
                  value={form.desc}
                  onChange={e => setForm({ ...form, desc: e.target.value })}
                  placeholder="Brief description..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setOpen(false)}
                className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                Cancel
              </button>
              <button onClick={handleAdd}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
                Add Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Policies;
