import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import api from "../../services/api";

/* ── helpers ─────────────────────────────────────────────────── */
const STATUS_DOT = {
  Present:  "bg-green-500",
  Absent:   "bg-red-500",
  "Half Day": "bg-yellow-500",
  WFH:      "bg-purple-500",
  Leave:    "bg-blue-500",
};
const STATUS_TEXT = {
  Present:  "text-green-600",
  Absent:   "text-red-500",
  "Half Day": "text-yellow-600",
  WFH:      "text-purple-600",
  Leave:    "text-blue-500",
};

const dot  = s => STATUS_DOT[s]  || "bg-gray-300";
const txt  = s => STATUS_TEXT[s] || "text-gray-500";
const fmtTime = v => v && v !== "-"
  ? new Date(`1970-01-01T${v}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  : "—";
const fmtHours = h => h > 0
  ? `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`
  : "—";

/* ── Skeleton ────────────────────────────────────────────────── */
const Skeleton = () => (
  <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl animate-pulse">
    <div className="h-7 bg-gray-200 rounded w-48"></div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {[1,2,3].map(i => <div key={i} className="h-28 bg-white rounded-2xl border border-gray-200"></div>)}
    </div>
    <div className="h-36 bg-white rounded-2xl border border-gray-200"></div>
    <div className="h-64 bg-white rounded-2xl border border-gray-200"></div>
  </div>
);

/* ── Regularization Modal ────────────────────────────────────── */
const RegularizationModal = ({ onClose, onSubmit }) => {
  const [date, setDate]     = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!date || !reason.trim()) return toast.error("Fill all fields");
    setSaving(true);
    try { await onSubmit({ date, reason }); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-semibold dark:text-white">Request Regularization</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-xl">
            <i className="ri-close-line"></i>
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          If your attendance was not recorded correctly, request HR to review and correct it.
        </p>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Reason</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="e.g. Forgot to clock out, technical issue..."
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving || !date || !reason.trim()}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
            {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ──────────────────────────────────────────── */
const EmployeeAttendance = () => {
  const { user } = useAuth();

  const [loading,       setLoading]       = useState(true);
  const [todayRecord,   setTodayRecord]   = useState(null);
  const [monthSummary,  setMonthSummary]  = useState(null);
  const [leaveBalance,  setLeaveBalance]  = useState(null);
  const [history,       setHistory]       = useState([]);
  const [workMode,      setWorkMode]      = useState("office");
  const [clockingIn,    setClockingIn]    = useState(false);
  const [clockingOut,   setClockingOut]   = useState(false);
  const [showRegular,   setShowRegular]   = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, summaryRes, historyRes] = await Promise.all([
        api.get("/attendance/my-today"),
        api.get("/attendance/my-summary"),
        api.get("/attendance/my-history?limit=20"),
      ]);
      setTodayRecord(todayRes.data.data);
      setMonthSummary(summaryRes.data.data);
      setHistory(historyRes.data.data || []);

      // leave balance — optional, silent fail
      try {
        const lb = await api.get("/leaves/balance");
        setLeaveBalance(lb.data.data);
      } catch { /* not critical */ }
    } catch {
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleClockIn = async () => {
    setClockingIn(true);
    try {
      await api.post("/attendance/clock-in", { mode: workMode });
      toast.success("Clocked in successfully");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Clock in failed");
    } finally {
      setClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    setClockingOut(true);
    try {
      await api.post("/attendance/clock-out");
      toast.success("Clocked out successfully");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Clock out failed");
    } finally {
      setClockingOut(false);
    }
  };

  const hasClockedIn  = !!(todayRecord?.checkIn  && todayRecord.checkIn  !== "-");
  const hasClockedOut = !!(todayRecord?.checkOut && todayRecord.checkOut !== "-");

  if (loading) return <Skeleton />;

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold dark:text-white">My Attendance</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-3 py-1 rounded-full font-medium">Employee</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Today's Status */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Today's Status</p>
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${todayRecord?.status ? dot(todayRecord.status) : "bg-gray-300"}`}></span>
            <span className={`text-sm font-semibold ${todayRecord?.status ? txt(todayRecord.status) : "text-gray-400 dark:text-gray-500"}`}>
              {todayRecord?.status || "Not marked"}
            </span>
          </div>
          <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <p>In: <span className="text-gray-700 dark:text-gray-300 font-medium">{fmtTime(todayRecord?.checkIn)}</span></p>
            <p>Out: <span className="text-gray-700 dark:text-gray-300 font-medium">{fmtTime(todayRecord?.checkOut)}</span></p>
            {todayRecord?.workingHours > 0 && (
              <p className="text-blue-600 dark:text-blue-400 font-medium mt-1">{fmtHours(todayRecord.workingHours)} worked</p>
            )}
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">This Month</p>
          <div className="space-y-1.5 text-xs">
            {[
              { label: "Present",  val: monthSummary?.present  ?? 0, cls: "text-green-600 dark:text-green-400" },
              { label: "Absent",   val: monthSummary?.absent   ?? 0, cls: "text-red-500 dark:text-red-400" },
              { label: "Half Day", val: monthSummary?.halfDay  ?? 0, cls: "text-yellow-600 dark:text-yellow-400" },
              { label: "WFH",      val: monthSummary?.wfh      ?? 0, cls: "text-purple-600 dark:text-purple-400" },
            ].map(({ label, val, cls }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{label}</span>
                <span className={`font-semibold ${cls}`}>{val} days</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Balance */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Leave Balance</p>
          <div className="space-y-1.5 text-xs">
            {[
              { label: "Annual",  val: leaveBalance?.annual  ?? "—" },
              { label: "Sick",    val: leaveBalance?.sick    ?? "—" },
              { label: "Casual",  val: leaveBalance?.casual  ?? "—" },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{label}</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{val} {typeof val === "number" ? "days" : ""}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clock In / Out */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Clock In / Out</p>

        {/* Work mode */}
        <div className="flex gap-5 mb-5">
          {[
            { value: "office",      label: "Office" },
            { value: "home",        label: "WFH" },
            { value: "client-site", label: "Client Site" },
          ].map(opt => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
              <input type="radio" name="workMode" value={opt.value}
                checked={workMode === opt.value} onChange={() => setWorkMode(opt.value)}
                className="accent-blue-600" />
              {opt.label}
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={handleClockIn} disabled={hasClockedIn || clockingIn}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2
              ${hasClockedIn ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white shadow-sm"}`}>
            {clockingIn
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              : <i className="ri-login-circle-line text-base"></i>}
            {hasClockedIn ? "Already Clocked In" : "Clock In"}
          </button>

          <button onClick={handleClockOut} disabled={!hasClockedIn || hasClockedOut || clockingOut}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2
              ${!hasClockedIn || hasClockedOut ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white shadow-sm"}`}>
            {clockingOut
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              : <i className="ri-logout-circle-r-line text-base"></i>}
            {hasClockedOut ? "Already Clocked Out" : "Clock Out"}
          </button>
        </div>

        {hasClockedIn && !hasClockedOut && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 text-center">
            <i className="ri-time-line mr-1"></i>You are currently clocked in — working time is being tracked.
          </p>
        )}
        {hasClockedOut && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-3 text-center">
            <i className="ri-checkbox-circle-line mr-1"></i>Attendance recorded for today.
          </p>
        )}
      </div>

      {/* Attendance History */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Attendance History</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Your last 20 records</p>
          </div>
          <button onClick={() => setShowRegular(true)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            <i className="ri-edit-line"></i> Request Regularization
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                {["Date", "Day", "Check In", "Check Out", "Hours", "Status"].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
                    <i className="ri-calendar-line text-3xl block mb-2"></i>
                    No attendance records found
                  </td>
                </tr>
              ) : history.map(r => (
                <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-3 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap">
                    {new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(r.date).toLocaleDateString("en-IN", { weekday: "short" })}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{fmtTime(r.checkIn)}</td>
                  <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{fmtTime(r.checkOut)}</td>
                  <td className="px-5 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">{fmtHours(r.workingHours)}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                      <span className={`w-1.5 h-1.5 rounded-full ${dot(r.status)}`}></span>
                      <span className={txt(r.status)}>{r.status || "—"}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showRegular && (
        <RegularizationModal
          onClose={() => setShowRegular(false)}
          onSubmit={async (data) => {
            await api.post("/attendance/regularization", data);
            toast.success("Regularization request submitted");
            setShowRegular(false);
          }}
        />
      )}
    </div>
  );
};

export default EmployeeAttendance;
