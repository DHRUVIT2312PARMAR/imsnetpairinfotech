import React, { useState } from "react";
import { toast } from "react-toastify";

const initialLogs = [
  { id: 1,  user: "Rohit Prajapati", action: "LOGIN",           module: "Auth",       detail: "Logged in successfully",                    ip: "192.168.1.10", time: "2026-03-19 09:02" },
  { id: 2,  user: "Neha Patel",      action: "CREATE",          module: "Employee",   detail: "Added new employee: Arjun Chauhan",          ip: "192.168.1.12", time: "2026-03-19 09:15" },
  { id: 3,  user: "Amit Shah",       action: "UPDATE",          module: "Attendance", detail: "Marked attendance for 5 employees",          ip: "192.168.1.14", time: "2026-03-19 09:30" },
  { id: 4,  user: "Rohit Prajapati", action: "APPROVE",         module: "Leave",      detail: "Approved leave request #12 — Karan Joshi",  ip: "192.168.1.10", time: "2026-03-19 10:00" },
  { id: 5,  user: "Neha Patel",      action: "DELETE",          module: "Employee",   detail: "Removed employee: Sagar Patel (terminated)", ip: "192.168.1.12", time: "2026-03-19 10:45" },
  { id: 6,  user: "Amit Shah",       action: "EXPORT",          module: "Reports",    detail: "Exported attendance report as CSV",          ip: "192.168.1.14", time: "2026-03-19 11:00" },
  { id: 7,  user: "Rohit Prajapati", action: "ROLE_CHANGE",     module: "Auth",       detail: "Changed role of Sneha Desai: employee→hr",  ip: "192.168.1.10", time: "2026-03-19 11:30" },
  { id: 8,  user: "Priya Mehta",     action: "LOGIN",           module: "Auth",       detail: "Logged in successfully",                    ip: "192.168.1.20", time: "2026-03-19 12:00" },
  { id: 9,  user: "Neha Patel",      action: "UPDATE",          module: "Payroll",    detail: "Marked payroll as paid for March 2026",     ip: "192.168.1.12", time: "2026-03-19 13:15" },
  { id: 10, user: "Rohit Prajapati", action: "LOGOUT",          module: "Auth",       detail: "Logged out",                                ip: "192.168.1.10", time: "2026-03-19 14:00" },
  { id: 11, user: "Amit Shah",       action: "CREATE",          module: "Project",    detail: "Created project: NetPair v2.0",             ip: "192.168.1.14", time: "2026-03-18 09:10" },
  { id: 12, user: "Priya Mehta",     action: "REJECT",          module: "Leave",      detail: "Rejected leave request #8 — Pooja Patel",  ip: "192.168.1.20", time: "2026-03-18 10:30" },
];

const actionStyle = (a) => ({
  LOGIN:       "bg-green-100 text-green-700",
  LOGOUT:      "bg-gray-100 text-gray-600",
  CREATE:      "bg-blue-100 text-blue-700",
  UPDATE:      "bg-yellow-100 text-yellow-700",
  DELETE:      "bg-red-100 text-red-700",
  APPROVE:     "bg-emerald-100 text-emerald-700",
  REJECT:      "bg-red-100 text-red-700",
  EXPORT:      "bg-purple-100 text-purple-700",
  ROLE_CHANGE: "bg-orange-100 text-orange-700",
}[a] || "bg-gray-100 text-gray-600");

const AuditLogs = () => {
  const [isLoading] = useState(false);
  const [logs]          = useState(initialLogs);
  const [search, setSearch]   = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");

  const filtered = logs.filter(l => {
    const matchSearch = l.user.toLowerCase().includes(search.toLowerCase()) || l.detail.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === "All" || l.action === actionFilter;
    const logDate = l.time.split(" ")[0];
    const matchFrom = !dateFrom || logDate >= dateFrom;
    const matchTo   = !dateTo   || logDate <= dateTo;
    return matchSearch && matchAction && matchFrom && matchTo;
  });

  const exportCSV = () => {
    const rows = [["User","Action","Module","Detail","IP","Time"],
      ...filtered.map(l => [l.user, l.action, l.module, l.detail, l.ip, l.time])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv," + encodeURIComponent(csv); a.download = "audit_logs.csv"; a.click();
    toast.success("Logs exported");
  };

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <button onClick={exportCSV} className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition text-sm">
          <i className="ri-download-line"></i> Export CSV
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Events",  value: logs.length,                                          color: "from-blue-500 to-indigo-600",   icon: "ri-file-history-line" },
          { label: "Logins",        value: logs.filter(l => l.action === "LOGIN").length,        color: "from-green-500 to-emerald-600", icon: "ri-login-box-line" },
          { label: "Data Changes",  value: logs.filter(l => ["CREATE","UPDATE","DELETE"].includes(l.action)).length, color: "from-yellow-500 to-orange-500", icon: "ri-edit-line" },
          { label: "Critical",      value: logs.filter(l => ["DELETE","ROLE_CHANGE"].includes(l.action)).length,    color: "from-red-500 to-rose-600",      icon: "ri-alert-line" },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-5 text-white bg-gradient-to-r ${s.color} shadow-lg hover:shadow-2xl transition hover:-translate-y-1`}>
            <div className="flex justify-between items-center">
              <div><p className="text-xs opacity-90">{s.label}</p><h2 className="text-2xl font-bold mt-1">{s.value}</h2></div>
              <div className="bg-white/20 p-2.5 rounded-xl text-xl"><i className={s.icon}></i></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3 flex-wrap">
        <input type="text" placeholder="Search user or action..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 text-sm" />
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="border border-gray-300 p-2.5 rounded-lg outline-none text-sm">
          <option value="All">All Actions</option>
          {["LOGIN","LOGOUT","CREATE","UPDATE","DELETE","APPROVE","REJECT","EXPORT","ROLE_CHANGE"].map(a => <option key={a}>{a}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-gray-300 p-2.5 rounded-lg outline-none text-sm" />
        <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   className="border border-gray-300 p-2.5 rounded-lg outline-none text-sm" />
        <button onClick={() => { setSearch(""); setActionFilter("All"); setDateFrom(""); setDateTo(""); }}
          className="border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm">Reset</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">User</th>
              <th className="px-6 py-4 text-center font-semibold">Action</th>
              <th className="px-6 py-4 text-center font-semibold">Module</th>
              <th className="px-6 py-4 text-left font-semibold">Detail</th>
              <th className="px-6 py-4 text-center font-semibold">IP Address</th>
              <th className="px-6 py-4 text-center font-semibold">Time</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-full"></div></td>
                    ))}
                  </tr>
                ))
              : filtered.map(l => (
              <tr key={l.id} className="border-t hover:bg-blue-50/40 transition">
                <td className="px-6 py-4 font-medium">{l.user}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${actionStyle(l.action)}`}>{l.action}</span>
                </td>
                <td className="px-6 py-4 text-center text-gray-500">{l.module}</td>
                <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{l.detail}</td>
                <td className="px-6 py-4 text-center text-gray-400 font-mono text-xs">{l.ip}</td>
                <td className="px-6 py-4 text-center text-gray-400 text-xs">{l.time}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">No logs found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;
