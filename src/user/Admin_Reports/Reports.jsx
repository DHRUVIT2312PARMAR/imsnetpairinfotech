import React, { useState } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { generateAttendanceReportPDF } from "../../services/pdfService";

const attendanceTrend = [
  { month: "Oct '25", Present: 78, Absent: 13, Late: 8 },
  { month: "Nov '25", Present: 82, Absent: 10, Late: 6 },
  { month: "Dec '25", Present: 70, Absent: 18, Late: 10 },
  { month: "Jan '26", Present: 85, Absent: 8,  Late: 5 },
  { month: "Feb '26", Present: 80, Absent: 12, Late: 7 },
  { month: "Mar '26", Present: 88, Absent: 6,  Late: 4 },
];

const leaveByType = [
  { name: "Casual",    value: 42, color: "#3b5bdb" },
  { name: "Sick",      value: 28, color: "#fa5252" },
  { name: "Emergency", value: 14, color: "#ffa94d" },
];

const attendanceData = [
  { id: 1, employee: "Rohit",  date: "09-02-2026", checkIn: "09:30", checkOut: "06:00", status: "Present" },
  { id: 2, employee: "Amit",   date: "09-02-2026", checkIn: "10:10", checkOut: "-",     status: "Late" },
  { id: 3, employee: "Neha",   date: "09-02-2026", checkIn: "-",     checkOut: "-",     status: "Absent" },
  { id: 4, employee: "Karan",  date: "09-02-2026", checkIn: "09:15", checkOut: "06:10", status: "Present" },
  { id: 5, employee: "Priya",  date: "09-02-2026", checkIn: "-",     checkOut: "-",     status: "Absent" },
];

const statusStyle = (status) => {
  switch (status) {
    case "Present": return "bg-green-100 text-green-700";
    case "Late":    return "bg-yellow-100 text-yellow-700";
    case "Absent":  return "bg-red-100 text-red-700";
    default:        return "bg-gray-100 text-gray-600";
  }
};

const ReportCard = ({ title, value, color, icon }) => (
  <div className={`relative overflow-hidden rounded-2xl p-6 text-white bg-gradient-to-r ${color} shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm opacity-80 tracking-wide">{title}</p>
        <h2 className="text-4xl font-bold mt-1">{value}</h2>
      </div>
      <div className="bg-white/20 backdrop-blur-md p-4 rounded-xl">
        <i className={`${icon} text-2xl`}></i>
      </div>
    </div>
  </div>
);

const Reports = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({ fromDate: "", toDate: "", department: "All" });

  const handleExport = () => {
    const rows = [["Employee","Date","Check In","Check Out","Status"], ...attendanceData.map(r => [r.employee, r.date, r.checkIn, r.checkOut, r.status])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "attendance_report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
        <button onClick={handleExport} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
          <i className="ri-download-line"></i> Export CSV
        </button>
        <button onClick={() => generateAttendanceReportPDF(attendanceData, filters)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2">
          <i className="ri-file-pdf-line"></i> Export PDF
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
        <ReportCard title="Employees"       value="40" color="from-blue-500 to-blue-700"   icon="ri-team-line" />
        <ReportCard title="Present Today"   value="32" color="from-green-500 to-green-700" icon="ri-user-follow-line" />
        <ReportCard title="Assets Assigned" value="25" color="from-purple-500 to-purple-700" icon="ri-computer-line" />
        <ReportCard title="Tasks Completed" value="18" color="from-orange-500 to-orange-700" icon="ri-task-line" />
      </div>

      {/* Filters — date range */}
      <div className="bg-white p-5 rounded-xl shadow border flex flex-wrap gap-4 items-end">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">From Date</label>
          <input type="date" className="border p-2 rounded-lg outline-none text-sm"
            value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">To Date</label>
          <input type="date" className="border p-2 rounded-lg outline-none text-sm"
            value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">Department</label>
          <select className="border p-2 rounded-lg outline-none text-sm"
            value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
            <option>All</option><option>Development</option><option>HR</option><option>Design</option><option>Testing</option>
          </select>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition text-sm">Apply Filter</button>
        <button onClick={() => setFilters({ fromDate: "", toDate: "", department: "All" })}
          className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">Reset</button>
      </div>

      {/* Charts */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-[220px] bg-gray-100 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Attendance Trend Line Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <p className="text-base font-semibold text-gray-800 mb-4">Attendance Trend (6 Months)</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={attendanceTrend}>
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
        </div>

        {/* Leave by Type Pie Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <p className="text-base font-semibold text-gray-800 mb-4">Leave by Type</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={leaveByType} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}>
                {leaveByType.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}

      {/* Attendance Report Table */}
      <div className="bg-white rounded-xl shadow p-5 border">
        <h2 className="text-lg font-semibold mb-4">Attendance Report</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="p-3 text-left">Employee</th>
                <th className="p-3 text-center">Date</th>
                <th className="p-3 text-center">Check In</th>
                <th className="p-3 text-center">Check Out</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((item) => (
                <tr key={item.id} className="border-b hover:bg-blue-50 transition text-center">
                  <td className="p-3 text-left font-medium">{item.employee}</td>
                  <td className="p-3">{item.date}</td>
                  <td className="p-3">{item.checkIn}</td>
                  <td className="p-3">{item.checkOut}</td>
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle(item.status)}`}>
                      {item.status}
                    </span>
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
