import React, { useState, useCallback } from "react";
import LeaveCards from "../../components/Leave/LeaveCards";
import LeaveTable from "../../components/Leave/LeaveTable";
import LeaveFilters from "../../components/Leave/LeaveFilter";
import { toast } from "react-toastify";
import useApi from "../../hooks/useApi";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const emptyForm = { employeeName: "", type: "Casual", fromDate: "", toDate: "", reason: "" };

const Leave = () => {
  const { user } = useAuth();
  const [filters, setFilters]     = useState({ search: "", status: "All", type: "All" });
  const [applyOpen, setApplyOpen] = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = useCallback(() => {
    const params = { limit: 50 };
    if (filters.status !== "All") params.status = filters.status;
    if (filters.type   !== "All") params.type   = filters.type;
    if (filters.search)           params.search = filters.search;
    return api.get("/leaves", { params }).then(r => r.data.data);
  }, [filters]);

  const { data, loading, error, refetch } = useApi(fetchLeaves, [filters]);

  const leaveData = (data?.leaves || []).map(l => ({
    id:     l._id,
    name:   l.employeeName,
    type:   l.type,
    from:   l.fromDate?.split("T")[0] || l.fromDate,
    to:     l.toDate?.split("T")[0]   || l.toDate,
    days:   l.days,
    status: l.status,
  }));

  const setQuickFilter = (status) => setFilters(p => ({ ...p, status }));

  const handleStatusChange = async (id, newStatus) => {
    try {
      const endpoint = newStatus === "Approved" ? `/leaves/${id}/approve` : `/leaves/${id}/reject`;
      await api.put(endpoint, {});
      toast.success(`Leave ${newStatus.toLowerCase()}`);
      refetch();
    } catch {
      toast.error("Failed to update leave status");
    }
  };

  const handleApply = async () => {
    if (!form.employeeName || !form.fromDate || !form.toDate)
      return toast.error("Please fill all required fields");
    setSubmitting(true);
    try {
      await api.post("/leaves", { ...form, employeeId: user?._id });
      toast.success("Leave application submitted");
      setApplyOpen(false);
      setForm(emptyForm);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit leave");
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    total:    data?.total || 0,
    pending:  leaveData.filter(l => l.status === "Pending").length,
    approved: leaveData.filter(l => l.status === "Approved").length,
    rejected: leaveData.filter(l => l.status === "Rejected").length,
  };

  // Leave balance from approved leaves
  const balanceTypes = [
    { type: "Casual",    total: 12, color: "bg-blue-500" },
    { type: "Sick",      total: 8,  color: "bg-green-500" },
    { type: "Emergency", total: 4,  color: "bg-orange-500" },
  ];
  const balance = balanceTypes.map(b => ({
    ...b,
    used: leaveData.filter(l => l.type === b.type && l.status === "Approved")
                   .reduce((sum, l) => sum + (l.days || 0), 0),
  }));

  const filteredData = leaveData.filter(l =>
    l.name.toLowerCase().includes(filters.search.toLowerCase()) &&
    (filters.status === "All" || l.status === filters.status) &&
    (filters.type   === "All" || l.type   === filters.type)
  );

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Leave Management</h1>
        <button
          onClick={() => setApplyOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
        >
          <i className="ri-add-line"></i> Apply Leave
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <i className="ri-error-warning-line"></i> {error}
          <button onClick={refetch} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-gray-200"></div>
          ))}
        </div>
      ) : (
        <LeaveCards stats={stats} setQuickFilter={setQuickFilter} />
      )}

      {/* Leave Balance */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <p className="text-base font-semibold text-gray-800 mb-4">Leave Balance</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {balance.map((b, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-700">{b.type}</p>
                <p className="text-xs text-gray-500">{b.used}/{b.total} used</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${b.color} h-2 rounded-full transition-all`}
                  style={{ width: `${Math.min(100, (b.used / b.total) * 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <LeaveFilters filters={filters} setFilters={setFilters} />
      <LeaveTable data={filteredData} onStatusChange={handleStatusChange} />

      {/* Apply Leave Modal */}
      {applyOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Apply for Leave</h3>
              <button onClick={() => setApplyOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Employee Name *</label>
                <input
                  className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1 text-sm"
                  value={form.employeeName}
                  onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Leave Type</label>
                <select
                  className="w-full border border-gray-300 p-2.5 rounded-lg outline-none mt-1 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option>Casual</option>
                  <option>Sick</option>
                  <option>Emergency</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">From *</label>
                  <input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg outline-none mt-1 text-sm"
                    value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">To *</label>
                  <input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg outline-none mt-1 text-sm"
                    value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Reason</label>
                <textarea
                  className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1 text-sm resize-none"
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Brief reason for leave..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setApplyOpen(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleApply} disabled={submitting}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-60">
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leave;
