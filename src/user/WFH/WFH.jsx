import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import api from "../../services/api";

const emptyForm = { date: "", reason: "" };

const statusStyle = (s) => ({
  Approved: "bg-green-100 text-green-700",
  Pending:  "bg-yellow-100 text-yellow-700",
  Rejected: "bg-red-100 text-red-700",
}[s] || "bg-gray-100 text-gray-600");

const WFH = () => {
  const { user, hasPermission } = useAuth();
  const canApprove = hasPermission("wfh:write") && user?.role !== "employee";

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [form, setForm]       = useState(emptyForm);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("All");
  const [saving, setSaving]   = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/wfh?limit=50&sortBy=createdAt&order=desc");
      setRecords(data.data?.data || []);
    } catch { toast.error("Failed to load WFH records"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const stats = [
    { label: "Total",    value: records.length,                                       color: "from-blue-500 to-indigo-600",   icon: "ri-home-office-line" },
    { label: "Approved", value: records.filter(r => r.status === "Approved").length,  color: "from-green-500 to-emerald-600", icon: "ri-checkbox-circle-line" },
    { label: "Pending",  value: records.filter(r => r.status === "Pending").length,   color: "from-yellow-500 to-orange-500", icon: "ri-time-line" },
    { label: "Rejected", value: records.filter(r => r.status === "Rejected").length,  color: "from-red-500 to-rose-600",      icon: "ri-close-circle-line" },
  ];

  const filtered = records.filter(r =>
    (r.employeeName || "").toLowerCase().includes(search.toLowerCase()) &&
    (filter === "All" || r.status === filter)
  );

  const handleSubmit = async () => {
    if (!form.date || !form.reason) return toast.error("Fill all required fields");
    setSaving(true);
    try {
      const { data } = await api.post("/wfh", form);
      setRecords(prev => [data.data, ...prev]);
      toast.success("WFH request submitted");
      setOpen(false); setForm(emptyForm);
    } catch (err) { toast.error(err.response?.data?.message || "Failed to submit"); }
    finally { setSaving(false); }
  };

  const handleStatus = async (id, status) => {
    try {
      const { data } = await api.put(`/wfh/${id}/status`, { status });
      setRecords(prev => prev.map(r => r._id === id ? data.data : r));
      toast.success(`Request ${status.toLowerCase()}`);
    } catch { toast.error("Failed to update"); }
  };

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold">WFH Records</h1>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition">
          <i className="ri-add-line"></i> Request WFH
        </button>
      </div>

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

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 text-sm" />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="border border-gray-300 p-2.5 rounded-lg outline-none text-sm">
          <option value="All">All Status</option>
          <option>Approved</option><option>Pending</option><option>Rejected</option>
        </select>
        <button onClick={() => { setSearch(""); setFilter("All"); }} className="border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm">Reset</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Employee</th>
              <th className="px-6 py-4 text-center font-semibold">Date</th>
              <th className="px-6 py-4 text-left font-semibold">Reason</th>
              <th className="px-6 py-4 text-center font-semibold">Status</th>
              {canApprove && <th className="px-6 py-4 text-center font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t animate-pulse">
                {Array.from({ length: canApprove ? 5 : 4 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-full"></div></td>
                ))}
              </tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={canApprove ? 5 : 4} className="px-6 py-12 text-center text-gray-400 text-sm">No records found</td></tr>
            ) : filtered.map(r => (
              <tr key={r._id} className="border-t hover:bg-blue-50/40 transition">
                <td className="px-6 py-4 font-medium">{r.employeeName}</td>
                <td className="px-6 py-4 text-center">{r.date}</td>
                <td className="px-6 py-4 text-gray-600">{r.reason}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle(r.status)}`}>{r.status}</span>
                </td>
                {canApprove && (
                  <td className="px-6 py-4 text-center">
                    {r.status === "Pending" && (
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleStatus(r._id, "Approved")} className="p-2 rounded-lg hover:bg-green-50"><i className="ri-check-line text-green-600 text-lg"></i></button>
                        <button onClick={() => handleStatus(r._id, "Rejected")} className="p-2 rounded-lg hover:bg-red-50"><i className="ri-close-line text-red-600 text-lg"></i></button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Request WFH</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl"><i className="ri-close-line"></i></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Date *</label>
                <input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1 text-sm"
                  value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
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
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WFH;
