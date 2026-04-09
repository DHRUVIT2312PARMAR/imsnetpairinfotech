import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import api from "../../services/api";
import { generatePayslipPDF } from "../../services/pdfService";

const emptyForm = { employeeId: "", basicSalary: "", allowances: "", deductions: "", tax: "", month: new Date().getMonth() + 1, year: new Date().getFullYear() };

const statusStyle = (s) => ({
  Paid:      "bg-green-100 text-green-700",
  Draft:     "bg-gray-100 text-gray-600",
  Processed: "bg-blue-100 text-blue-700",
}[s] || "bg-yellow-100 text-yellow-700");

const Payroll = () => {
  const { user, hasPermission } = useAuth();
  const canManage = hasPermission("payroll:write");

  const [records, setRecords]   = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [slipOpen, setSlipOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState(emptyForm);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("All");
  const [saving, setSaving]     = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/payroll?limit=100&sortBy=createdAt&order=desc");
      setRecords(data.data?.data || []);
    } catch { toast.error("Failed to load payroll"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    if (canManage) {
      api.get("/employees?limit=100").then(({ data }) => {
        setEmployees(data.data?.data || []);
      }).catch(() => {});
    }
  }, [fetchAll, canManage]);

  const totalPayroll   = records.reduce((s, r) => s + (r.netSalary || 0), 0);
  const totalPaid      = records.filter(r => r.status === "Paid").reduce((s, r) => s + (r.netSalary || 0), 0);
  const totalPending   = records.filter(r => r.status !== "Paid").reduce((s, r) => s + (r.netSalary || 0), 0);
  const totalDeductions = records.reduce((s, r) => s + (r.deductions || 0) + (r.tax || 0), 0);

  const stats = [
    { label: "Total Payroll",   value: `₹${(totalPayroll/1000).toFixed(0)}K`,   color: "from-blue-500 to-indigo-600",   icon: "ri-money-dollar-circle-line" },
    { label: "Paid",            value: `₹${(totalPaid/1000).toFixed(0)}K`,      color: "from-green-500 to-emerald-600", icon: "ri-checkbox-circle-line" },
    { label: "Pending",         value: `₹${(totalPending/1000).toFixed(0)}K`,   color: "from-yellow-500 to-orange-500", icon: "ri-time-line" },
    { label: "Total Deductions",value: `₹${(totalDeductions/1000).toFixed(0)}K`,color: "from-red-500 to-rose-600",      icon: "ri-subtract-line" },
  ];

  const filtered = records.filter(r =>
    (r.employeeName || "").toLowerCase().includes(search.toLowerCase()) &&
    (filter === "All" || r.status === filter)
  );

  const handleGenerate = async () => {
    if (!form.employeeId || !form.basicSalary) return toast.error("Fill all required fields");
    setSaving(true);
    try {
      const { data } = await api.post("/payroll", { ...form, basicSalary: +form.basicSalary, allowances: +form.allowances||0, deductions: +form.deductions||0, tax: +form.tax||0 });
      setRecords(prev => [data.data, ...prev]);
      toast.success("Payslip generated");
      setOpen(false); setForm(emptyForm);
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const handleMarkPaid = async (id) => {
    try {
      const { data } = await api.put(`/payroll/${id}/mark-paid`);
      setRecords(prev => prev.map(r => r._id === id ? data.data : r));
      toast.success("Marked as paid");
    } catch { toast.error("Failed"); }
  };

  const exportCSV = () => {
    const rows = [["Employee","Department","Basic","Allowances","Deductions","Tax","Net Pay","Status","Month","Year"],
      ...records.map(r => [r.employeeName, r.department, r.basicSalary, r.allowances, r.deductions, r.tax, r.netSalary, r.status, r.month, r.year])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv," + encodeURIComponent(csv); a.download = "payroll.csv"; a.click();
    toast.success("CSV exported");
  };

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Payroll</h1>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition text-sm">
            <i className="ri-download-line"></i> Export CSV
          </button>
          {canManage && (
            <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition text-sm">
              <i className="ri-add-line"></i> Generate Payslip
            </button>
          )}
        </div>
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
          <option>Draft</option><option>Processed</option><option>Paid</option>
        </select>
        <button onClick={() => { setSearch(""); setFilter("All"); }} className="border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm">Reset</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Employee</th>
              <th className="px-6 py-4 text-center font-semibold">Department</th>
              <th className="px-6 py-4 text-center font-semibold">Basic</th>
              <th className="px-6 py-4 text-center font-semibold">Allowances</th>
              <th className="px-6 py-4 text-center font-semibold">Deductions</th>
              <th className="px-6 py-4 text-center font-semibold">Net Pay</th>
              <th className="px-6 py-4 text-center font-semibold">Status</th>
              <th className="px-6 py-4 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t animate-pulse">
                {Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-full"></div></td>)}
              </tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">No payroll records found</td></tr>
            ) : filtered.map(r => (
              <tr key={r._id} className="border-t hover:bg-blue-50/40 transition">
                <td className="px-6 py-4"><p className="font-medium">{r.employeeName}</p><p className="text-xs text-gray-500">{r.month}/{r.year}</p></td>
                <td className="px-6 py-4 text-center">{r.department}</td>
                <td className="px-6 py-4 text-center">₹{(r.basicSalary||0).toLocaleString()}</td>
                <td className="px-6 py-4 text-center text-green-600">+₹{(r.allowances||0).toLocaleString()}</td>
                <td className="px-6 py-4 text-center text-red-500">-₹{((r.deductions||0)+(r.tax||0)).toLocaleString()}</td>
                <td className="px-6 py-4 text-center font-semibold">₹{(r.netSalary||0).toLocaleString()}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle(r.status)}`}>{r.status}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => { setSelected(r); setSlipOpen(true); }} className="p-2 rounded-lg hover:bg-blue-50" title="View">
                      <i className="ri-eye-line text-blue-600 text-lg"></i>
                    </button>
                    <button onClick={() => generatePayslipPDF(r)} className="p-2 rounded-lg hover:bg-purple-50" title="PDF">
                      <i className="ri-file-pdf-line text-purple-600 text-lg"></i>
                    </button>
                    {canManage && r.status !== "Paid" && (
                      <button onClick={() => handleMarkPaid(r._id)} className="p-2 rounded-lg hover:bg-green-50" title="Mark Paid">
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

      {/* Generate Modal */}
      {open && canManage && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Generate Payslip</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl"><i className="ri-close-line"></i></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Employee *</label>
                <select className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1 text-sm"
                  value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
                  <option value="">Select employee</option>
                  {employees.map(e => <option key={e._id} value={e._id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </div>
              {[
                { label: "Basic Salary *", field: "basicSalary" },
                { label: "Allowances",     field: "allowances" },
                { label: "Deductions",     field: "deductions" },
                { label: "Tax",            field: "tax" },
              ].map(({ label, field }) => (
                <div key={field}>
                  <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
                  <input type="number" placeholder="0"
                    className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1 text-sm"
                    value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Month</label>
                  <select className="w-full border border-gray-300 p-2.5 rounded-lg outline-none mt-1 text-sm"
                    value={form.month} onChange={e => setForm({ ...form, month: +e.target.value })}>
                    {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString("default", { month: "long" })}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Year</label>
                  <input type="number" className="w-full border border-gray-300 p-2.5 rounded-lg outline-none mt-1 text-sm"
                    value={form.year} onChange={e => setForm({ ...form, year: +e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleGenerate} disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Payslip Modal */}
      {slipOpen && selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Payslip — {selected.month}/{selected.year}</h3>
              <button onClick={() => setSlipOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl"><i className="ri-close-line"></i></button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ["Employee",   selected.employeeName],
                ["Department", selected.department],
                ["Basic",      `₹${(selected.basicSalary||0).toLocaleString()}`],
                ["Allowances", `+₹${(selected.allowances||0).toLocaleString()}`],
                ["Deductions", `-₹${(selected.deductions||0).toLocaleString()}`],
                ["Tax",        `-₹${(selected.tax||0).toLocaleString()}`],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">{label}</span><span className="font-medium">{val}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 font-bold text-base">
                <span>Net Pay</span><span>₹{(selected.netSalary||0).toLocaleString()}</span>
              </div>
            </div>
            <button onClick={() => setSlipOpen(false)} className="w-full mt-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
