import React, { useState, useEffect, useCallback } from "react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { generateAttendanceReportPDF } from "../../services/pdfService";
import { toast } from "react-toastify";
import api from "../../services/api";

const COLORS = ["#3b5bdb","#fa5252","#ffa94d","#40c057"];

const statusStyle = (s) => ({
  Present: "bg-green-100 text-green-700",
  Late:    "bg-yellow-100 text-yellow-700",
  Absent:  "bg-red-100 text-red-700",
  WFH:     "bg-purple-100 text-purple-700",
}[s] || "bg-gray-100 text-gray-600");

const Reports = () => {
  const [loading, setLoading]         = useState(true);
  const [summary, setSummary]         = useState({});
  const [trend, setTrend]             = useState([]);
  const [leaveByType, setLeaveByType] = useState([]);
  const [records, setRecords]         = useState([]);
  const [filters, setFilters]         = useState({ fromDate: "", toDate: "", department: "All" });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, trendRes, leaveRes] = await Promise.all([
        api.get("/reports/summary"),
        api.get("/reports/attendance-trend"),
        api.get("/reports/leave-by-type"),
      ]);
      setSummary(sumRes.data.data || {});
      setTrend(trendRes.data.data || []);
      setLeaveByType(leaveRes.data.data || []);
    } catch { toast.error("Failed to load reports"); }
    finally { setLoading(false); }
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.fromDate)              params.set("from", filters.fromDate);
      if (filters.toDate)                params.set("to", filters.toDate);
      if (filters.department !== "All")  params.set("department", filters.department);
      const { data } = await api.get(`/reports/attendance-records?${params}`);
      setRecords(data.data || []);
    } catch { toast.error("Failed to load records"); }
  }, [filters]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleExport = () => {
    if (records.length === 0) return toast.error("No records to export");
    const rows = [["Employee","Department","Date","Check In","Check Out","Status"],
      ...records.map(r => [r.employeeName, r.department, r.date, r.checkIn||"—", r.checkOut||"—", r.status])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "attendance_report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
        <div className="flex gap-3">
          <button onClick={handleExport} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm">
            <i className="ri-download-line"></i> Export CSV
          </button>
          <button onClick={() => generateAttendanceReportPDF(records, filters)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2 text-sm">
            <i className="ri-file-pdf-line"></i> Export PDF
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: "Total Employees",   value: loading ? "—" : summary.totalEmp      ?? 0, color: "from-blue-500 to-blue-700",     icon: "ri-team-line" },
          { title: "Present Today",     value: loading ? "—" : summary.presentToday  ?? 0, color: "from-green-500 to-green-700",   icon: "ri-user-follow-line" },
          { title: "Assets Assigned",   value: loading ? "—" : summary.assetsAssigned ?? 0, color: "from-purple-500 to-purple-700", icon: "ri-computer-line" },
          { title: "Tasks Completed",   value: loading ? "—" : summary.tasksCompleted ?? 0, color: "from-orange-500 to-orange-700", icon: "ri-task-line" },
        ].map((s, i) => (
          <div key={i} className={`relative overflow-hidden rounded-2xl p-6 text-white bg-gradient-to-r ${s.color} shadow-md hover:shadow-2xl transition-all hover:-translate-y-1`}>
            <div className="flex items-center justify-between">
              <div><p className="text-sm opacity-80">{s.title}</p><h2 className="text-4xl font-bold mt-1">{s.value}</h2></div>
              <div className="bg-white/20 backdrop-blur-md p-4 rounded-xl"><i className={`${s.icon} text-2xl`}></i></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl shadow border flex flex-wrap gap-4 items-end">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">From Date</label>
          <input type="date" className="border p-2 rounded-lg outline-none text-sm"
            value={filters.fromDate} onChange={e => setFilters({ ...filters, fromDate: e.target.value })} />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">To Date</label>
          <input type="date" className="border p-2 rounded-lg outline-none text-sm"
            value={filters.toDate} onChange={e => setFilters({ ...filters, toDate: e.target.value })} />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">Department</label>
          <select className="border p-2 rounded-lg outline-none text-sm"
            value={filters.department} onChange={e => setFilters({ ...filters, department: e.target.value })}>
            <option>All</option><option>Development</option><option>HR</option><option>Design</option><option>Testing</option><option>Management</option>
          </select>
        </div>
        <button onClick={() => setFilters({ fromDate: "", toDate: "", department: "All" })}
          className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">Reset</button>
      </div>

      {/* Charts */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1,2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-[220px] bg-gray-100 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <p className="text-base font-semibold text-gray-800 mb-4">Attendance Trend (6 Months)</p>
            {trend.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No attendance data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="Present" stroke="#3b5bdb" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Absent"  stroke="#fa5252" strokeWidth={1.5} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="Late"    stroke="#ffa94d" strokeWidth={1.5} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <p className="text-base font-semibold text-gray-800 mb-4">Leave by Type</p>
            {leaveByType.every(l => l.value === 0) ? (
              <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No approved leaves yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={leaveByType} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}>
                    {leaveByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Attendance Records Table */}
      <div className="bg-white rounded-xl shadow p-5 border">
        <h2 className="text-lg font-semibold mb-4">Attendance Records</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="p-3 text-left">Employee</th>
                <th className="p-3 text-center">Department</th>
                <th className="p-3 text-center">Date</th>
                <th className="p-3 text-center">Check In</th>
                <th className="p-3 text-center">Check Out</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400 text-sm">
                  No attendance records found for the selected filters.
                </td></tr>
              ) : records.map((r, i) => (
                <tr key={r._id || i} className="border-b hover:bg-blue-50 transition text-center">
                  <td className="p-3 text-left font-medium">{r.employeeName}</td>
                  <td className="p-3">{r.department || "—"}</td>
                  <td className="p-3">{r.date}</td>
                  <td className="p-3">{r.checkIn || "—"}</td>
                  <td className="p-3">{r.checkOut || "—"}</td>
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle(r.status)}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
