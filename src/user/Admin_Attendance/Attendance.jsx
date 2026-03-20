import React, { useState, useCallback } from "react";
import AttendanceCards from "../../components/Attendance/AttendanceCards";
import AttendanceFilter from "../../components/Attendance/AttendanceFilter";
import AttendanceModal from "../../components/Attendance/AttendanceModal";
import { RiCalendarCheckLine } from "react-icons/ri";
import { toast } from "react-toastify";
import useApi from "../../hooks/useApi";
import api from "../../services/api";

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {Array.from({ length: 6 }).map((_, i) => (
      <td key={i} className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-full"></div></td>
    ))}
  </tr>
);

const Attendance = () => {
  const [open, setOpen] = useState(false);

  const fetchRecords = useCallback(() =>
    api.get("/attendance/records", { params: { limit: 50 } }).then(r => r.data.data), []);

  const { data, loading, error, refetch } = useApi(fetchRecords, []);

  const attendanceData = (data?.records || []).map(r => ({
    id:     r._id,
    name:   r.employeeName,
    date:   r.date,
    in:     r.checkIn  || "-",
    out:    r.checkOut || "-",
    status: r.status,
    dept:   r.department,
    mode:   r.mode || "",
  }));

  const handleMarkAttendance = async (formData) => {
    try {
      await api.post("/attendance/mark", formData);
      toast.success("Attendance marked");
      setOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to mark attendance");
    }
  };

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-semibold">Attendance Management</h2>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition justify-center"
        >
          <RiCalendarCheckLine size={18} /> Mark Attendance
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <i className="ri-error-warning-line"></i> {error}
          <button onClick={refetch} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {open && (
        <AttendanceModal
          onClose={() => setOpen(false)}
          onSubmit={handleMarkAttendance}
        />
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      ) : (
        <AttendanceCards data={attendanceData} />
      )}

      {/* Late arrivals highlight */}
      {!loading && (() => {
        const late = attendanceData.filter(d => d.in !== "-" && d.in > "09:30");
        return late.length > 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-yellow-800 mb-2 flex items-center gap-2">
              <i className="ri-time-line"></i> Late Arrivals ({late.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {late.map(d => (
                <span key={d.id} className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
                  {d.name} — {d.in}
                </span>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      <AttendanceFilter attendanceData={attendanceData} />
    </div>
  );
};

export default Attendance;
