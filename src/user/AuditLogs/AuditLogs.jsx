import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";

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
  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [dateFrom, setDateFrom]       = useState("");
  const [dateTo, setDateTo]           = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 200, sortBy: "createdAt", order: "desc" });
      if (actionFilter !== "All") params.set("action", actionFilter);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo)   params.set("to", dateTo);
      const { data } = await api.get(`/audit-logs?${params}`);
      setLogs(data.data?.data || []);
    } catch { toast.error("Failed to load audit logs"); }
    finally { setLoading(false); }
  }, [actionFilter, dateFrom, dateTo]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = logs.filter(l =>
    (l.userName || "").toLowerCase().includes(search.toLowerCase()) ||
    (l.detail || "").toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const rows = [["User","Action","Module","Detail","IP","Time"],
      ...filtered.map(l => [l.userName, l.action, l.module, l.detail, l.ip, new Date(l.createdAt).toLocaleString("en-IN")])];
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Events", value: logs.length,                                                                          color: "from-blue-500 to-indigo-600",   icon: "ri-file-history-line" },
          { label: "Logins",       value: logs.filter(l => l.action === "LOGIN").length,                                        color: "from-green-500 to-emerald-600", icon: "ri-login-box-line" },
          { label: "Data Changes", value: logs.filter(l => ["CREATE","UPDATE","DELETE"].includes(l.action)).length,             color: "from-yellow-500 to-orange-500", icon: "ri-edit-line" },
          { label: "Critical",     value: logs.filter(l => ["DELETE","ROLE_CHANGE"].includes(l.action)).length,                 color: "from-red-500 to-rose-600",      icon: "ri-alert-line" },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-5 text-white bg-gradient-to-r ${s.color} shadow-lg hover:shadow-2xl transition hover:-translate-y-1`}>
            <div className="flex justify-between items-center">
              <div><p className="text-xs opacity-90">{s.label}</p><h2 className="text-2xl font-bold mt-1">{s.value}</h2></div>
              <div className="bg-white/20 p-2.5 rounded-xl text-xl"><i className={s.icon}></i></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3 flex-wrap">
        <input type="text" placeholder="Search user or detail..." value={search} onChange={e => setSearch(e.target.value)}
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

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">User</th>
              <th className="px-6 py-4 text-center font-semibold">Action</th>
              <th className="px-6 py-4 text-center font-semibold">Module</th>
              <th className="px-6 py-4 text-left font-semibold">Detail</th>
              <th className="px-6 py-4 text-center font-semibold">IP</th>
              <th className="px-6 py-4 text-center font-semibold">Time</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t animate-pulse">
                {Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-full"></div></td>)}
              </tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                <i className="ri-file-history-line text-3xl block mb-2"></i>
                No audit logs yet. Actions will appear here as users interact with the system.
              </td></tr>
            ) : filtered.map((l, i) => (
              <tr key={l._id || i} className="border-t hover:bg-blue-50/40 transition">
                <td className="px-6 py-4 font-medium">{l.userName}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${actionStyle(l.action)}`}>{l.action}</span>
                </td>
                <td className="px-6 py-4 text-center text-gray-500">{l.module}</td>
                <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{l.detail}</td>
                <td className="px-6 py-4 text-center text-gray-400 font-mono text-xs">{l.ip || "—"}</td>
                <td className="px-6 py-4 text-center text-gray-400 text-xs">
                  {new Date(l.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;
