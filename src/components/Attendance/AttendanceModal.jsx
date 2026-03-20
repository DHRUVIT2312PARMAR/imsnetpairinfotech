import React, { useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";

const AttendanceModal = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState({
    employeeId: "",
    date: new Date().toISOString().split("T")[0],
    checkIn: "",
    checkOut: "",
    status: "Present",
    mode: "Office",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.employeeId || !form.date || !form.status)
      return toast.error("Employee ID, date and status are required");

    setSaving(true);
    try {
      if (onSubmit) {
        await onSubmit(form);
      } else {
        await api.post("/attendance/mark", form);
        toast.success("Attendance marked");
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to mark attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-5">Mark Attendance</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="att-empid" className="text-xs font-bold text-gray-500 uppercase">Employee ID *</label>
            <input id="att-empid"
              type="text" placeholder="MongoDB ObjectId or Employee ID"
              value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
            />
          </div>
          <div>
            <label htmlFor="att-date" className="text-xs font-bold text-gray-500 uppercase">Date *</label>
            <input id="att-date" type="date" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="att-checkin" className="text-xs font-bold text-gray-500 uppercase">Check In</label>
              <input id="att-checkin" type="time" value={form.checkIn}
                onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
              />
            </div>
            <div>
              <label htmlFor="att-checkout" className="text-xs font-bold text-gray-500 uppercase">Check Out</label>
              <input id="att-checkout" type="time" value={form.checkOut}
                onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="att-status" className="text-xs font-bold text-gray-500 uppercase">Status *</label>
              <select id="att-status" value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm">
                <option>Present</option><option>Absent</option><option>WFH</option><option>Half Day</option>
              </select>
            </div>
            <div>
              <label htmlFor="att-mode" className="text-xs font-bold text-gray-500 uppercase">Mode</label>
              <select id="att-mode" value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm">
                <option>Office</option><option>WFH</option><option>Hybrid</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition shadow-md text-sm disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;
