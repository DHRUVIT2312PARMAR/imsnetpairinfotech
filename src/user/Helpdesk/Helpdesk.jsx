import React, { useState } from "react";
import { toast } from "react-toastify";

const initialTickets = [
  { id: 1, subject: "VPN not connecting",        category: "IT",       priority: "High",   status: "Open",        assignee: "IT Team",    created: "2026-03-17", desc: "Cannot connect to company VPN from home." },
  { id: 2, subject: "Salary slip not received",  category: "HR",       priority: "Medium", status: "In Progress", assignee: "HR Team",    created: "2026-03-16", desc: "March salary slip not in email." },
  { id: 3, subject: "Laptop keyboard broken",    category: "Hardware", priority: "High",   status: "Resolved",    assignee: "IT Team",    created: "2026-03-15", desc: "Keys not responding." },
  { id: 4, subject: "Leave policy clarification",category: "HR",       priority: "Low",    status: "Closed",      assignee: "HR Team",    created: "2026-03-14", desc: "Need clarity on casual leave rules." },
  { id: 5, subject: "Software license expired",  category: "IT",       priority: "Medium", status: "Open",        assignee: "Unassigned", created: "2026-03-18", desc: "Adobe license expired." },
];

const emptyForm = { subject: "", category: "IT", priority: "Medium", desc: "" };

const priorityStyle = (p) => ({ High: "bg-red-100 text-red-700", Medium: "bg-yellow-100 text-yellow-700", Low: "bg-green-100 text-green-700" }[p] || "bg-gray-100 text-gray-600");
const statusStyle   = (s) => ({ Open: "bg-blue-100 text-blue-700", "In Progress": "bg-purple-100 text-purple-700", Resolved: "bg-green-100 text-green-700", Closed: "bg-gray-100 text-gray-600" }[s] || "bg-gray-100 text-gray-600");

const Helpdesk = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [tickets, setTickets] = useState(initialTickets);
  const [open, setOpen]       = useState(false);
  const [detail, setDetail]   = useState(null);
  const [form, setForm]       = useState(emptyForm);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("All");

  const stats = [
    { label: "Open",        value: tickets.filter(t => t.status === "Open").length,        color: "from-blue-500 to-indigo-600",   icon: "ri-ticket-line" },
    { label: "In Progress", value: tickets.filter(t => t.status === "In Progress").length, color: "from-purple-500 to-violet-600", icon: "ri-loader-line" },
    { label: "Resolved",    value: tickets.filter(t => t.status === "Resolved").length,    color: "from-green-500 to-emerald-600", icon: "ri-checkbox-circle-line" },
    { label: "Closed",      value: tickets.filter(t => t.status === "Closed").length,      color: "from-gray-500 to-slate-600",    icon: "ri-close-circle-line" },
  ];

  const filtered = tickets.filter(t =>
    t.subject.toLowerCase().includes(search.toLowerCase()) &&
    (filter === "All" || t.status === filter)
  );

  const handleSubmit = () => {
    if (!form.subject || !form.desc) return toast.error("Fill all required fields");
    setTickets(prev => [{
      id: Date.now(), ...form, status: "Open",
      assignee: "Unassigned",
      created: new Date().toISOString().split("T")[0]
    }, ...prev]);
    toast.success("Ticket raised successfully");
    setOpen(false); setForm(emptyForm);
  };

  const handleStatusChange = (id, status) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    toast.success(`Ticket marked as ${status}`);
  };

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Helpdesk</h1>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition text-sm">
          <i className="ri-add-line"></i> Raise Ticket
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`rounded-2xl p-5 text-white bg-gradient-to-r ${s.color} shadow-lg hover:shadow-2xl transition hover:-translate-y-1`}>
            <div className="flex justify-between items-center">
              <div><p className="text-xs opacity-90">{s.label}</p><h2 className="text-2xl font-bold mt-1">{s.value}</h2></div>
              <div className="bg-white/20 p-2.5 rounded-xl text-xl"><i className={s.icon}></i></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 text-sm" />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="border border-gray-300 p-2.5 rounded-lg outline-none text-sm">
          <option value="All">All Status</option>
          <option>Open</option><option>In Progress</option><option>Resolved</option><option>Closed</option>
        </select>
        <button onClick={() => { setSearch(""); setFilter("All"); }} className="border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm">Reset</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[750px]">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Subject</th>
              <th className="px-6 py-4 text-center font-semibold">Category</th>
              <th className="px-6 py-4 text-center font-semibold">Priority</th>
              <th className="px-6 py-4 text-center font-semibold">Assignee</th>
              <th className="px-6 py-4 text-center font-semibold">Created</th>
              <th className="px-6 py-4 text-center font-semibold">Status</th>
              <th className="px-6 py-4 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-full"></div></td>
                    ))}
                  </tr>
                ))
              : filtered.map(t => (
              <tr key={t.id} className="border-t hover:bg-blue-50/40 transition">
                <td className="px-6 py-4">
                  <p className="font-medium cursor-pointer hover:text-blue-600" onClick={() => setDetail(t)}>{t.subject}</p>
                  <p className="text-xs text-gray-400">{t.category}</p>
                </td>
                <td className="px-6 py-4 text-center text-gray-500">{t.category}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${priorityStyle(t.priority)}`}>{t.priority}</span>
                </td>
                <td className="px-6 py-4 text-center text-gray-500">{t.assignee}</td>
                <td className="px-6 py-4 text-center text-gray-400 text-xs">{t.created}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyle(t.status)}`}>{t.status}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => setDetail(t)} className="p-2 rounded-lg hover:bg-blue-50" title="View">
                      <i className="ri-eye-line text-blue-600 text-lg"></i>
                    </button>
                    {t.status === "Open" && (
                      <button onClick={() => handleStatusChange(t.id, "In Progress")} className="p-2 rounded-lg hover:bg-purple-50" title="Start">
                        <i className="ri-play-line text-purple-600 text-lg"></i>
                      </button>
                    )}
                    {t.status === "In Progress" && (
                      <button onClick={() => handleStatusChange(t.id, "Resolved")} className="p-2 rounded-lg hover:bg-green-50" title="Resolve">
                        <i className="ri-check-line text-green-600 text-lg"></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">No tickets found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Raise Ticket Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Raise a Ticket</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl"><i className="ri-close-line"></i></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Subject *</label>
                <input className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1 text-sm"
                  value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Brief issue title" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                  <select className="w-full border border-gray-300 p-2.5 rounded-lg outline-none mt-1 text-sm"
                    value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option>IT</option><option>HR</option><option>Hardware</option><option>General</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Priority</label>
                  <select className="w-full border border-gray-300 p-2.5 rounded-lg outline-none mt-1 text-sm"
                    value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Description *</label>
                <textarea rows={4} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1 text-sm resize-none"
                  value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Describe the issue in detail..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Ticket Details</h3>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-red-500 text-2xl"><i className="ri-close-line"></i></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Subject</span><span className="font-medium">{detail.subject}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Category</span><span>{detail.category}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Priority</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityStyle(detail.priority)}`}>{detail.priority}</span>
              </div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyle(detail.status)}`}>{detail.status}</span>
              </div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Assignee</span><span>{detail.assignee}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Created</span><span>{detail.created}</span></div>
              <div className="py-2"><p className="text-gray-500 mb-1">Description</p><p className="text-gray-700">{detail.desc}</p></div>
            </div>
            <button onClick={() => setDetail(null)} className="w-full mt-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Helpdesk;
