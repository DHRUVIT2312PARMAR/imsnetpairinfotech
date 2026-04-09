import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import api from "../../services/api";

const emptyForm = { subject: "", category: "IT", priority: "Medium", description: "" };

const priorityStyle = (p) => ({ High: "bg-red-100 text-red-700", Medium: "bg-yellow-100 text-yellow-700", Low: "bg-green-100 text-green-700" }[p] || "bg-gray-100 text-gray-600");
const statusStyle   = (s) => ({ Open: "bg-blue-100 text-blue-700", "In Progress": "bg-purple-100 text-purple-700", Resolved: "bg-green-100 text-green-700", Closed: "bg-gray-100 text-gray-600" }[s] || "bg-gray-100 text-gray-600");

const Helpdesk = () => {
  const { hasPermission, user } = useAuth();
  const canManage = user?.role !== "employee";

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [detail, setDetail]   = useState(null);
  const [form, setForm]       = useState(emptyForm);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("All");
  const [saving, setSaving]   = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/tickets?limit=50&sortBy=createdAt&order=desc");
      setTickets(data.data?.data || []);
    } catch { toast.error("Failed to load tickets"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const stats = [
    { label: "Open",        value: tickets.filter(t => t.status === "Open").length,        color: "from-blue-500 to-indigo-600",   icon: "ri-ticket-line" },
    { label: "In Progress", value: tickets.filter(t => t.status === "In Progress").length, color: "from-purple-500 to-violet-600", icon: "ri-loader-line" },
    { label: "Resolved",    value: tickets.filter(t => t.status === "Resolved").length,    color: "from-green-500 to-emerald-600", icon: "ri-checkbox-circle-line" },
    { label: "Closed",      value: tickets.filter(t => t.status === "Closed").length,      color: "from-gray-500 to-slate-600",    icon: "ri-close-circle-line" },
  ];

  const filtered = tickets.filter(t =>
    (t.subject || "").toLowerCase().includes(search.toLowerCase()) &&
    (filter === "All" || t.status === filter)
  );

  const handleSubmit = async () => {
    if (!form.subject || !form.description) return toast.error("Fill all required fields");
    setSaving(true);
    try {
      const { data } = await api.post("/tickets", form);
      setTickets(prev => [data.data, ...prev]);
      toast.success("Ticket raised successfully");
      setOpen(false); setForm(emptyForm);
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const { data } = await api.put(`/tickets/${id}`, { status });
      setTickets(prev => prev.map(t => t._id === id ? data.data : t));
      toast.success(`Ticket marked as ${status}`);
    } catch { toast.error("Failed to update"); }
  };

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Helpdesk</h1>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition text-sm">
          <i className="ri-add-line"></i> Raise Ticket
        </button>
      </div>

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

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 text-sm" />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="border border-gray-300 p-2.5 rounded-lg outline-none text-sm">
          <option value="All">All Status</option>
          <option>Open</option><option>In Progress</option><option>Resolved</option><option>Closed</option>
        </select>
        <button onClick={() => { setSearch(""); setFilter("All"); }} className="border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm">Reset</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[750px]">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Subject</th>
              <th className="px-6 py-4 text-center font-semibold">Category</th>
              <th className="px-6 py-4 text-center font-semibold">Priority</th>
              <th className="px-6 py-4 text-center font-semibold">Created</th>
              <th className="px-6 py-4 text-center font-semibold">Status</th>
              <th className="px-6 py-4 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t animate-pulse">
                {Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-full"></div></td>)}
              </tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">No tickets found</td></tr>
            ) : filtered.map(t => (
              <tr key={t._id} className="border-t hover:bg-blue-50/40 transition">
                <td className="px-6 py-4">
                  <p className="font-medium cursor-pointer hover:text-blue-600" onClick={() => setDetail(t)}>{t.subject}</p>
                  {t.employeeName && <p className="text-xs text-gray-400">{t.employeeName}</p>}
                </td>
                <td className="px-6 py-4 text-center text-gray-500">{t.category}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${priorityStyle(t.priority)}`}>{t.priority}</span>
                </td>
                <td className="px-6 py-4 text-center text-gray-400 text-xs">{new Date(t.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyle(t.status)}`}>{t.status}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => setDetail(t)} className="p-2 rounded-lg hover:bg-blue-50" title="View">
                      <i className="ri-eye-line text-blue-600 text-lg"></i>
                    </button>
                    {canManage && t.status === "Open" && (
                      <button onClick={() => handleStatusChange(t._id, "In Progress")} className="p-2 rounded-lg hover:bg-purple-50" title="Start">
                        <i className="ri-play-line text-purple-600 text-lg"></i>
                      </button>
                    )}
                    {canManage && t.status === "In Progress" && (
                      <button onClick={() => handleStatusChange(t._id, "Resolved")} className="p-2 rounded-lg hover:bg-green-50" title="Resolve">
                        <i className="ri-check-line text-green-600 text-lg"></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
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
                    <option>IT</option><option>HR</option><option>Admin</option><option>Other</option>
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
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Ticket Details</h3>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-red-500 text-2xl"><i className="ri-close-line"></i></button>
            </div>
            <div className="space-y-3 text-sm">
              {[["Subject", detail.subject], ["Category", detail.category], ["Priority", detail.priority], ["Status", detail.status], ["Raised by", detail.employeeName]].map(([label, val]) => (
                <div key={label} className="flex justify-between py-2 border-b"><span className="text-gray-500">{label}</span><span className="font-medium">{val}</span></div>
              ))}
              <div className="py-2"><p className="text-gray-500 mb-1">Description</p><p className="text-gray-700">{detail.description}</p></div>
            </div>
            <button onClick={() => setDetail(null)} className="w-full mt-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Helpdesk;
