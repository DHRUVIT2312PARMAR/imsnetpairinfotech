import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";

const SystemConfig = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState("");

  const [company, setCompany] = useState({ name: "", email: "", phone: "", address: "", website: "" });
  const [workHours, setWorkHours] = useState({ start: "09:00", end: "18:00", lateThreshold: "09:30", workDays: ["Mon","Tue","Wed","Thu","Fri"] });
  const [leaveConfig, setLeaveConfig] = useState({ annual: 12, sick: 8, casual: 6, carryForward: true });
  const [smtp, setSmtp] = useState({ host: "", port: "587", user: "", secure: true });

  useEffect(() => {
    api.get("/system-config").then(({ data }) => {
      const cfg = data.data || {};
      if (cfg.company)    setCompany(cfg.company);
      if (cfg.workHours)  setWorkHours(cfg.workHours);
      if (cfg.leaveConfig) setLeaveConfig(cfg.leaveConfig);
      if (cfg.smtp)       setSmtp(cfg.smtp);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async (key, value, label) => {
    setSaving(key);
    try {
      await api.put("/system-config", { key, value });
      toast.success(`${label} saved`);
    } catch (err) { toast.error(err.response?.data?.message || "Failed to save"); }
    finally { setSaving(""); }
  };

  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const toggleDay = (day) => setWorkHours(prev => ({
    ...prev,
    workDays: prev.workDays.includes(day) ? prev.workDays.filter(d => d !== day) : [...prev.workDays, day],
  }));

  if (loading) return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-200 h-48"></div>)}
    </div>
  );

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <h1 className="text-2xl font-semibold">System Configuration</h1>

      {/* Company Profile */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl"><i className="ri-building-line text-xl"></i></div>
          <h2 className="text-base font-semibold">Company Profile</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { label: "Company Name", field: "name",    placeholder: "NetPair InfoTech" },
            { label: "Email",        field: "email",   placeholder: "admin@company.com" },
            { label: "Phone",        field: "phone",   placeholder: "+91 00000 00000" },
            { label: "Website",      field: "website", placeholder: "https://company.com" },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
              <input className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1 text-sm"
                value={company[field] || ""} onChange={e => setCompany({ ...company, [field]: e.target.value })} placeholder={placeholder} />
            </div>
          ))}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
            <input className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1 text-sm"
              value={company.address || ""} onChange={e => setCompany({ ...company, address: e.target.value })} placeholder="Company address" />
          </div>
        </div>
        <button onClick={() => save("company", company, "Company")} disabled={saving === "company"}
          className="mt-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition text-sm flex items-center gap-2">
          {saving === "company" && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
          Save
        </button>
      </div>

      {/* Working Hours */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-green-50 text-green-600 p-3 rounded-xl"><i className="ri-time-line text-xl"></i></div>
          <h2 className="text-base font-semibold">Working Hours</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          {[
            { label: "Start Time",  field: "start" },
            { label: "End Time",    field: "end" },
            { label: "Late After",  field: "lateThreshold" },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
              <input type="time" className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1 text-sm"
                value={workHours[field] || ""} onChange={e => setWorkHours({ ...workHours, [field]: e.target.value })} />
            </div>
          ))}
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Work Days</label>
          <div className="flex gap-2 flex-wrap">
            {days.map(d => (
              <button key={d} onClick={() => toggleDay(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${(workHours.workDays || []).includes(d) ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => save("workHours", workHours, "Working Hours")} disabled={saving === "workHours"}
          className="mt-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition text-sm flex items-center gap-2">
          {saving === "workHours" && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
          Save
        </button>
      </div>

      {/* Leave Policy */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-yellow-50 text-yellow-600 p-3 rounded-xl"><i className="ri-survey-line text-xl"></i></div>
          <h2 className="text-base font-semibold">Leave Policy</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          {[
            { label: "Annual Leave (days)", field: "annual" },
            { label: "Sick Leave (days)",   field: "sick" },
            { label: "Casual Leave (days)", field: "casual" },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
              <input type="number" min="0" className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1 text-sm"
                value={leaveConfig[field] || 0} onChange={e => setLeaveConfig({ ...leaveConfig, [field]: +e.target.value })} />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <p className="text-sm text-gray-700">Allow carry-forward of unused leaves</p>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={leaveConfig.carryForward} onChange={e => setLeaveConfig({ ...leaveConfig, carryForward: e.target.checked })} className="sr-only peer" />
            <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
          </label>
        </div>
        <button onClick={() => save("leaveConfig", leaveConfig, "Leave Policy")} disabled={saving === "leaveConfig"}
          className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition text-sm flex items-center gap-2">
          {saving === "leaveConfig" && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
          Save
        </button>
      </div>

      {/* SMTP */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-purple-50 text-purple-600 p-3 rounded-xl"><i className="ri-mail-settings-line text-xl"></i></div>
          <h2 className="text-base font-semibold">Email / SMTP Settings</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { label: "SMTP Host",  field: "host", placeholder: "smtp.gmail.com" },
            { label: "SMTP Port",  field: "port", placeholder: "587" },
            { label: "From Email", field: "user", placeholder: "noreply@company.com" },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
              <input className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1 text-sm"
                value={smtp[field] || ""} onChange={e => setSmtp({ ...smtp, [field]: e.target.value })} placeholder={placeholder} />
            </div>
          ))}
          <div className="flex items-center justify-between py-3">
            <p className="text-sm text-gray-700">Use SSL/TLS</p>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={smtp.secure} onChange={e => setSmtp({ ...smtp, secure: e.target.checked })} className="sr-only peer" />
              <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
            </label>
          </div>
        </div>
        <button onClick={() => save("smtp", smtp, "SMTP")} disabled={saving === "smtp"}
          className="mt-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition text-sm flex items-center gap-2">
          {saving === "smtp" && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
          Save
        </button>
      </div>
    </div>
  );
};

export default SystemConfig;
