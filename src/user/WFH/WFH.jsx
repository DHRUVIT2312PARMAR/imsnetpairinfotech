import React, { useState } from "react";
import { toast } from "react-toastify";

const initialData = [
  { id: 1, name: "Rohit Prajapati", dept: "Development", date: "2026-03-18", reason: "Home internet setup", status: "Approved" },
  { id: 2, name: "Neha Patel",      dept: "Design",      date: "2026-03-18", reason: "Personal work",       status: "Pending" },
  { id: 3, name: "Amit Shah",       dept: "HR",          date: "2026-03-19", reason: "Doctor appointment",  status: "Approved" },
  { id: 4, name: "Karan Joshi",     dept: "Testing",     date: "2026-03-19", reason: "Travel",              status: "Rejected" },
  { id: 5, name: "Priya Mehta",     dept: "Development", date: "2026-03-20", reason: "Child care",          status: "Pending" },
];

const emptyForm = { name: "", dept: "Development", date: "", reason: "" };

const statusStyle = (s) => ({
  Approved: "bg-green-100 text-green-700",
  Pending:  "bg-yellow-100 text-yellow-700",
  Rejected: "bg-red-100 text-red-700",
}[s] || "bg-gray-100 text-gray-600");

const WFH = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [records, setRecords] = useState(initialData);
  const [open, setOpen]       = useState(false);
  const [form, setForm]       = useState(emptyForm);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("All");

  const stats = [
    { label: "Total Requests", value: records.length,                                       color: "from-blue-500 to-indigo-600",   icon: "ri-home-office-line" },
    { label: "Approved",       value: records.filter(r => r.status === "Approved").length,  color: "from-green-500 to-emerald-600", icon: "ri-checkbox-circle-line" },
    { label: "Pending",        value: records.filter(r => r.status === "Pending").length,   color: "from-yellow-500 to-orange-500", icon: "ri-time-line" },
    { label: "Rejected",       value: records.filter(r => r.status === "Rejected").length,  color: "from-red-500 to-rose-600",      icon: "ri-close-circle-line" },
  ];

  const filtered = records.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) &&
    (filter === "All" || r.status === filter)
  );

  const handleSubmit = () => {
    if (!form.name || !form.date || !form.reason) return toast.error("Please fill all required fields");
    setRecords(prev => [{ id: Date.now(), ...form, status: "Pending" }, ...prev]);
    toast.success("WFH request submitted");
    setOpen(false); setForm(emptyForm);
  };

  const handleStatus = (id, status) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    toast.success(`Request ${status.toLowerCase()}`);
  };

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold">WFH Records</h1>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition">
          <i className="ri-add-line"></i> Request WFH
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, i) => (
          <div key={i} className={`rounded-2xl p-6 text-white bg-gradient-to-r ${s.color} shadow-lg hover:shadow-2xl transition hover:-translate-y-1`}>
            <div className="flex justify-between items-center">
              <div><p className="text-sm opacity-90">{s.label}</p><h2 className="text-3xl font-bold mt-1">{s.value}</h2></div>
              <div className="bg-white/20 p-3 rounded-xl text-2xl"><i className={s.icon}></i></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 text-sm" />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="border border-gray-300 p-2.5 rounded-lg outline-none text-sm">
          <option value="All">All Status</option>
          <option>Approved</option><option>Pending</option><option>Rejected</option>
        </select>
        <button onClick={() => { setSearch(""); setFilter("All"); }} className="border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm">Reset</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Employee</th>
              <th className="px-6 py-4 text-center font-semibold">Department</th>
              <th className="px-6 py-4 text-center font-semibold">Date</th>
              <th className="px-6 py-4 text-left font-semibold">Reason</th>
              <th className="px-6 py-4 text-center font-semibold">Status</th>
              <th className="px-6 py-4 text-center font-semibold">Actions</th>
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
              : filtered.map(r => (
              <tr key={r.id} className="border-t hover:bg-blue-50/40 transition">
                <td className="px-6 py-4 font-medium">{r.name}</td>
                <td className="px-6 py-4 text-center">{r.dept}</td>
                <td className="px-6 py-4 text-center">{r.date}</td>
                <td className="px-6 py-4 text-gray-600">{r.reason}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle(r.status)}`}>{r.status}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  {r.status === "Pending" && (
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleStatus(r.id, "Approved")} className="p-2 rounded-lg hover:bg-green-50"><i className="ri-check-line text-green-600 text-lg"></i></button>
                      <button onClick={() => handleStatus(r.id, "Rejected")} className="p-2 rounded-lg hover:bg-red-50"><i className="ri-close-line text-red-600 text-lg"></i></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Request Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Request WFH</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl"><i className="ri-close-line"></i></button>
            </div>
            <div className="space-y-4">
              {[
                { label: "Employee Name *", field: "name", type: "text", placeholder: "Your name" },
                { label: "Date *",          field: "date", type: "date", placeholder: "" },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
                  <input type={type} placeholder={placeholder}
                    className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1 text-sm"
                    value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} />
                </div>
              ))}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Department</label>
                <select className="w-full border border-gray-300 p-2.5 rounded-lg outline-none mt-1 text-sm"
                  value={form.dept} onChange={e => setForm({ ...form, dept: e.target.value })}>
                  {["Development","Design","HR","Testing","Management","Analytics"].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Reason *</label>
                <textarea rows={3} placeholder="Reason for WFH..."
                  className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1 text-sm resize-none"
                  value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WFH;
