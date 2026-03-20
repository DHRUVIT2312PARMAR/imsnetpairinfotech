import React, { useState } from "react";
import { toast } from "react-toastify";
import { generatePayslipPDF } from "../../services/pdfService";

const initialPayroll = [
  { id: 1, name: "Rohit Prajapati", dept: "Development", designation: "Sr. Developer",  basic: 60000, allowances: 15000, deductions: 5000, status: "Paid",    month: "March 2026" },
  { id: 2, name: "Neha Patel",      dept: "Design",      designation: "UI Designer",    basic: 45000, allowances: 10000, deductions: 3500, status: "Pending", month: "March 2026" },
  { id: 3, name: "Amit Shah",       dept: "HR",          designation: "HR Manager",     basic: 55000, allowances: 12000, deductions: 4500, status: "Paid",    month: "March 2026" },
  { id: 4, name: "Karan Joshi",     dept: "Testing",     designation: "QA Engineer",    basic: 40000, allowances: 8000,  deductions: 3000, status: "Pending", month: "March 2026" },
  { id: 5, name: "Priya Mehta",     dept: "Development", designation: "React Developer",basic: 50000, allowances: 11000, deductions: 4000, status: "Paid",    month: "March 2026" },
];

const emptyForm = { name: "", dept: "Development", designation: "", basic: "", allowances: "", deductions: "", month: "March 2026" };

const statusStyle = (s) => s === "Paid"
  ? "bg-green-100 text-green-700"
  : "bg-yellow-100 text-yellow-700";

const Payroll = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [records, setRecords]   = useState(initialPayroll);
  const [open, setOpen]         = useState(false);
  const [slipOpen, setSlipOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState(emptyForm);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("All");

  const totalPayroll  = records.reduce((s, r) => s + r.basic + r.allowances - r.deductions, 0);
  const totalPaid     = records.filter(r => r.status === "Paid").reduce((s, r) => s + r.basic + r.allowances - r.deductions, 0);
  const totalPending  = records.filter(r => r.status === "Pending").reduce((s, r) => s + r.basic + r.allowances - r.deductions, 0);
  const totalDeductions = records.reduce((s, r) => s + r.deductions, 0);

  const stats = [
    { label: "Total Payroll",  value: `₹${(totalPayroll/1000).toFixed(0)}K`,   color: "from-blue-500 to-indigo-600",   icon: "ri-money-dollar-circle-line" },
    { label: "Paid",           value: `₹${(totalPaid/1000).toFixed(0)}K`,      color: "from-green-500 to-emerald-600", icon: "ri-checkbox-circle-line" },
    { label: "Pending",        value: `₹${(totalPending/1000).toFixed(0)}K`,   color: "from-yellow-500 to-orange-500", icon: "ri-time-line" },
    { label: "Total Deductions",value: `₹${(totalDeductions/1000).toFixed(0)}K`,color: "from-red-500 to-rose-600",     icon: "ri-subtract-line" },
  ];

  const filtered = records.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) &&
    (filter === "All" || r.status === filter)
  );

  const handleGenerate = () => {
    if (!form.name || !form.designation || !form.basic) return toast.error("Fill all required fields");
    setRecords(prev => [{ id: Date.now(), ...form, basic: +form.basic, allowances: +form.allowances || 0, deductions: +form.deductions || 0, status: "Pending" }, ...prev]);
    toast.success("Payslip generated");
    setOpen(false); setForm(emptyForm);
  };

  const handleMarkPaid = (id) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: "Paid" } : r));
    toast.success("Marked as paid");
  };

  const exportCSV = () => {
    const rows = [["Name","Department","Designation","Basic","Allowances","Deductions","Net Pay","Status","Month"],
      ...records.map(r => [r.name, r.dept, r.designation, r.basic, r.allowances, r.deductions, r.basic + r.allowances - r.deductions, r.status, r.month])];
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
          <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition text-sm">
            <i className="ri-add-line"></i> Generate Payslip
          </button>
        </div>
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
          <option>Paid</option><option>Pending</option>
        </select>
        <button onClick={() => { setSearch(""); setFilter("All"); }} className="border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm">Reset</button>
      </div>

      {/* Table */}
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
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-full"></div></td>
                    ))}
                  </tr>
                ))
              : filtered.map(r => (
              <tr key={r.id} className="border-t hover:bg-blue-50/40 transition">
                <td className="px-6 py-4">
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.designation}</p>
                </td>
                <td className="px-6 py-4 text-center">{r.dept}</td>
                <td className="px-6 py-4 text-center">₹{r.basic.toLocaleString()}</td>
                <td className="px-6 py-4 text-center text-green-600">+₹{r.allowances.toLocaleString()}</td>
                <td className="px-6 py-4 text-center text-red-500">-₹{r.deductions.toLocaleString()}</td>
                <td className="px-6 py-4 text-center font-semibold">₹{(r.basic + r.allowances - r.deductions).toLocaleString()}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle(r.status)}`}>{r.status}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => { setSelected(r); setSlipOpen(true); }} className="p-2 rounded-lg hover:bg-blue-50" title="View Payslip">
                      <i className="ri-eye-line text-blue-600 text-lg"></i>
                    </button>
                    <button onClick={() => generatePayslipPDF(r)} className="p-2 rounded-lg hover:bg-purple-50" title="Download PDF">
                      <i className="ri-file-pdf-line text-purple-600 text-lg"></i>
                    </button>
                    {r.status === "Pending" && (
                      <button onClick={() => handleMarkPaid(r.id)} className="p-2 rounded-lg hover:bg-green-50" title="Mark Paid">
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

      {/* Generate Payslip Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Generate Payslip</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl"><i className="ri-close-line"></i></button>
            </div>
            <div className="space-y-4">
              {[
                { label: "Employee Name *", field: "name",        type: "text",   placeholder: "Full name" },
                { label: "Designation *",   field: "designation", type: "text",   placeholder: "e.g. Sr. Developer" },
                { label: "Basic Salary *",  field: "basic",       type: "number", placeholder: "e.g. 50000" },
                { label: "Allowances",      field: "allowances",  type: "number", placeholder: "e.g. 10000" },
                { label: "Deductions",      field: "deductions",  type: "number", placeholder: "e.g. 3000" },
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
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleGenerate} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">Generate</button>
            </div>
          </div>
        </div>
      )}

      {/* Payslip View Modal */}
      {slipOpen && selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Payslip — {selected.month}</h3>
              <button onClick={() => setSlipOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl"><i className="ri-close-line"></i></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Employee</span><span className="font-medium">{selected.name}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Department</span><span>{selected.dept}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Designation</span><span>{selected.designation}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Basic Salary</span><span>₹{selected.basic.toLocaleString()}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Allowances</span><span className="text-green-600">+₹{selected.allowances.toLocaleString()}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Deductions</span><span className="text-red-500">-₹{selected.deductions.toLocaleString()}</span></div>
              <div className="flex justify-between py-2 font-bold text-base"><span>Net Pay</span><span>₹{(selected.basic + selected.allowances - selected.deductions).toLocaleString()}</span></div>
            </div>
            <button onClick={() => setSlipOpen(false)} className="w-full mt-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
