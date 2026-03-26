# Attendance Page — Role-Based Implementation Fix
## NetPair IMS — Correct View per Role

**Problem:** Employee is seeing the HR/Admin attendance management view  
**Root Cause:** Same component rendered for all roles, no role-based split  
**Fix:** Separate views per role — Employee sees own data, HR/Admin sees all employees  
**Last Updated:** March 2026  

---

## TABLE OF CONTENTS

1. [What Each Role Should See](#1-what-each-role-should-see)
2. [File Structure](#2-file-structure)
3. [Role Router Component](#3-role-router-component)
4. [Employee Attendance View](#4-employee-attendance-view)
5. [HR / Admin Attendance View](#5-hr--admin-attendance-view)
6. [Route Configuration](#6-route-configuration)
7. [Backend API Changes](#7-backend-api-changes)

---

## 1. WHAT EACH ROLE SHOULD SEE

### Employee — Own attendance only

```
┌─────────────────────────────────────────────────────────────────┐
│  My Attendance                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │  Today's Status │  │  This Month     │  │  Leave Balance │  │
│  │  ● Present      │  │  Present: 18    │  │  Annual: 10    │  │
│  │  In:  09:14 AM  │  │  Absent:  2     │  │  Sick:   6     │  │
│  │  Out: —         │  │  Half Day: 1    │  │  Casual: 4     │  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [  Clock In  ]          [  Clock Out  ]                  │  │
│  │  Location: ○ Office  ○ WFH  ○ Client Site                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  MY ATTENDANCE HISTORY                                          │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────────┐  │
│  │  Date    │ Check In │ Check Out│ Hours    │ Status       │  │
│  ├──────────┼──────────┼──────────┼──────────┼──────────────┤  │
│  │ 19 Mar   │ 09:14 AM │ 06:02 PM │ 8h 48m   │ ● Present   │  │
│  │ 18 Mar   │ 09:32 AM │ 05:45 PM │ 8h 13m   │ ● Present   │  │
│  │ 17 Mar   │ —        │ —        │ —        │ ● Leave     │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────────┘  │
│                                                                 │
│  [  Request Regularization  ]                                   │
└─────────────────────────────────────────────────────────────────┘

NO: Mark Attendance button
NO: All Departments dropdown
NO: Search employee name
NO: All employees table
```

### HR / Admin — All employees management view

```
┌─────────────────────────────────────────────────────────────────┐
│  Attendance Management                   [Mark Attendance]      │
├─────────────────────────────────────────────────────────────────┤
│  Total Employees: 94  Present: 78  Absent: 16  WFH: 8          │
│                                                                 │
│  Search employee name...                                        │
│  [All Departments ▼] [All Status ▼] [All Mode ▼] [Date Range]  │
│                                                                 │
│  Employee | Department | Date | Check In | Check Out | Status  │
│  ──────────────────────────────────────────────────────────     │
│  Ashish G | Engineering | Today | 09:14 | 18:02 | Present      │
│  Rohit P  | HR          | Today | 09:28 | —     | Present      │
└─────────────────────────────────────────────────────────────────┘
```

### SuperAdmin — Same as HR/Admin (Advanced mode)

```
Same as HR/Admin view + ability to edit any record directly
```

---

## 2. FILE STRUCTURE

```
src/pages/attendance/
├── Attendance.jsx              ← Role router (main entry)
├── EmployeeAttendance.jsx      ← Employee's own attendance view
├── HRAttendance.jsx            ← HR/Admin management view (current wrong view)
└── components/
    ├── ClockInOut.jsx          ← Clock in/out widget
    ├── AttendanceSummaryCards.jsx  ← Monthly summary cards
    ├── AttendanceHistoryTable.jsx  ← Employee's own history
    ├── AllEmployeesTable.jsx   ← HR/Admin full table
    └── RegularizationRequest.jsx  ← Employee regularization form
```

---

## 3. ROLE ROUTER COMPONENT

Create / replace `src/pages/attendance/Attendance.jsx`:

```jsx
import { useAuth } from '../../context/AuthContext';
import EmployeeAttendance from './EmployeeAttendance';
import HRAttendance       from './HRAttendance';

const Attendance = () => {
  const { user } = useAuth();

  // Employee sees only their own attendance
  if (user?.role === 'employee') {
    return <EmployeeAttendance />;
  }

  // HR, Admin, SuperAdmin see the management view
  if (['hr', 'admin', 'superAdmin'].includes(user?.role)) {
    return <HRAttendance />;
  }

  return null;
};

export default Attendance;
```

---

## 4. EMPLOYEE ATTENDANCE VIEW

Create `src/pages/attendance/EmployeeAttendance.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { useAuth }   from '../../context/AuthContext';
import { toast }     from 'react-toastify';
import api           from '../../services/api';

const EmployeeAttendance = () => {
  const { user } = useAuth();

  const [todayRecord,    setTodayRecord]    = useState(null);
  const [monthSummary,   setMonthSummary]   = useState(null);
  const [leaveBalance,   setLeaveBalance]   = useState(null);
  const [history,        setHistory]        = useState([]);
  const [workMode,       setWorkMode]       = useState('office');
  const [isClockingIn,   setIsClockingIn]   = useState(false);
  const [isClockingOut,  setIsClockingOut]  = useState(false);
  const [showRegular,    setShowRegular]    = useState(false);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [todayRes, summaryRes, balanceRes, historyRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get('/attendance/my-summary'),
        api.get('/leaves/balance'),
        api.get('/attendance/my-history?limit=20'),
      ]);
      setTodayRecord(todayRes.data.data);
      setMonthSummary(summaryRes.data.data);
      setLeaveBalance(balanceRes.data.data);
      setHistory(historyRes.data.data);
    } catch (err) {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    setIsClockingIn(true);
    try {
      await api.post('/attendance/clock-in', { location: { type: workMode } });
      toast.success('Clocked in successfully');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Clock in failed');
    } finally {
      setIsClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    setIsClockingOut(true);
    try {
      await api.post('/attendance/clock-out', { location: { type: workMode } });
      toast.success('Clocked out successfully');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Clock out failed');
    } finally {
      setIsClockingOut(false);
    }
  };

  const hasClockedIn  = !!todayRecord?.checkIn;
  const hasClockedOut = !!todayRecord?.checkOut;

  const statusColor = (status) => {
    if (!status) return 'text-gray-400';
    const map = {
      present:  'text-green-600',
      half_day: 'text-yellow-600',
      absent:   'text-red-500',
      leave:    'text-blue-500',
      wfh:      'text-purple-500',
    };
    return map[status] || 'text-gray-500';
  };

  const statusDot = (status) => {
    const map = {
      present:  'bg-green-500',
      half_day: 'bg-yellow-500',
      absent:   'bg-red-500',
      leave:    'bg-blue-500',
      wfh:      'bg-purple-500',
    };
    return map[status] || 'bg-gray-300';
  };

  const statusLabel = (status) => {
    const map = {
      present:  'Present',
      half_day: 'Half Day',
      absent:   'Absent',
      leave:    'On Leave',
      wfh:      'WFH',
    };
    return map[status] || '—';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500
                        border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">

      {/* Page Header */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Today's Status */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wide">
              Today's Status
            </p>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0
                ${todayRecord?.status ? statusDot(todayRecord.status) : 'bg-gray-300'}`} />
              <span className={`text-sm font-semibold ${
                todayRecord?.status ? statusColor(todayRecord.status) : 'text-gray-400'
              }`}>
                {todayRecord?.status ? statusLabel(todayRecord.status) : 'Not marked'}
              </span>
            </div>
            <div className="space-y-1 text-xs text-gray-500">
              <p>In:  {todayRecord?.checkIn
                ? new Date(todayRecord.checkIn).toLocaleTimeString()
                : '—'}
              </p>
              <p>Out: {todayRecord?.checkOut
                ? new Date(todayRecord.checkOut).toLocaleTimeString()
                : '—'}
              </p>
              {todayRecord?.workingHours > 0 && (
                <p className="text-blue-600 font-medium">
                  {Math.floor(todayRecord.workingHours)}h{' '}
                  {Math.round((todayRecord.workingHours % 1) * 60)}m worked
                </p>
              )}
            </div>
          </div>

          {/* This Month */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wide">
              This Month
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Present</span>
                <span className="font-semibold text-green-600">
                  {monthSummary?.present ?? 0} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Absent</span>
                <span className="font-semibold text-red-500">
                  {monthSummary?.absent ?? 0} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Half Day</span>
                <span className="font-semibold text-yellow-600">
                  {monthSummary?.halfDay ?? 0} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">WFH</span>
                <span className="font-semibold text-purple-600">
                  {monthSummary?.wfh ?? 0} days
                </span>
              </div>
            </div>
          </div>

          {/* Leave Balance */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wide">
              Leave Balance
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Annual</span>
                <span className="font-semibold text-blue-600">
                  {leaveBalance?.annual ?? 0} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sick</span>
                <span className="font-semibold text-blue-600">
                  {leaveBalance?.sick ?? 0} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Casual</span>
                <span className="font-semibold text-blue-600">
                  {leaveBalance?.casual ?? 0} days
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Clock In / Out Panel */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Clock In / Out</h3>

          {/* Work mode selector */}
          <div className="flex gap-4 mb-5">
            {[
              { value: 'office',      label: 'Office' },
              { value: 'home',        label: 'WFH' },
              { value: 'client-site', label: 'Client Site' },
            ].map(opt => (
              <label key={opt.value}
                className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="radio"
                  name="workMode"
                  value={opt.value}
                  checked={workMode === opt.value}
                  onChange={() => setWorkMode(opt.value)}
                  className="accent-blue-600"
                />
                {opt.label}
              </label>
            ))}
          </div>

          <div className="flex gap-3">
            {/* Clock In */}
            <button
              onClick={handleClockIn}
              disabled={hasClockedIn || isClockingIn}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold
                transition-colors flex items-center justify-center gap-2
                ${hasClockedIn
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
            >
              {isClockingIn ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              )}
              {hasClockedIn ? 'Already Clocked In' : 'Clock In'}
            </button>

            {/* Clock Out */}
            <button
              onClick={handleClockOut}
              disabled={!hasClockedIn || hasClockedOut || isClockingOut}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold
                transition-colors flex items-center justify-center gap-2
                ${!hasClockedIn || hasClockedOut
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
            >
              {isClockingOut ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              )}
              {hasClockedOut ? 'Already Clocked Out' : 'Clock Out'}
            </button>
          </div>

          {/* Cross-check hint */}
          {hasClockedIn && !hasClockedOut && (
            <p className="text-xs text-amber-600 mt-3 text-center">
              You are currently clocked in.
              Working time is being tracked.
            </p>
          )}
          {hasClockedOut && (
            <p className="text-xs text-green-600 mt-3 text-center">
              Attendance recorded for today.
            </p>
          )}
        </div>

        {/* Attendance History */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4
                          border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">
              Attendance History
            </h3>
            <button
              onClick={() => setShowRegular(true)}
              className="text-xs text-blue-600 hover:underline">
              Request Regularization
            </button>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Date','Day','Check In','Check Out','Hours','Status'].map(h => (
                  <th key={h}
                    className="text-left text-xs font-medium text-gray-500
                               px-5 py-3 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6}
                    className="text-center py-12 text-gray-400 text-sm">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                history.map(record => (
                  <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-gray-800">
                      {new Date(record.date).toLocaleDateString('en-IN',
                        { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {new Date(record.date).toLocaleDateString('en-IN',
                        { weekday: 'short' })}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">
                      {record.checkIn
                        ? new Date(record.checkIn).toLocaleTimeString([], {
                            hour: '2-digit', minute: '2-digit',
                          })
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">
                      {record.checkOut
                        ? new Date(record.checkOut).toLocaleTimeString([], {
                            hour: '2-digit', minute: '2-digit',
                          })
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-blue-600">
                      {record.workingHours
                        ? `${Math.floor(record.workingHours)}h ${Math.round((record.workingHours % 1) * 60)}m`
                        : <span className="text-gray-300 font-normal">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5
                        text-xs font-medium`}>
                        <span className={`w-1.5 h-1.5 rounded-full
                          ${statusDot(record.status)}`} />
                        <span className={statusColor(record.status)}>
                          {statusLabel(record.status)}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Regularization Modal */}
        {showRegular && (
          <RegularizationModal
            onClose={() => setShowRegular(false)}
            onSubmit={async (data) => {
              try {
                await api.post('/attendance/regularization/request', data);
                toast.success('Regularization request submitted');
                setShowRegular(false);
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to submit');
              }
            }}
          />
        )}

      </div>
    </div>
  );
};

/* ── Regularization Modal ───────────────────────────────────── */
const RegularizationModal = ({ onClose, onSubmit }) => {
  const [date, setDate]     = useState('');
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          Request Attendance Regularization
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          If your attendance was not recorded correctly, request HR to
          review and correct it.
        </p>

        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2
                       text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Explain what happened (e.g. forgot to clock out, technical issue)"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2
                       text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2 border border-gray-300 rounded-lg
                       text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={() => onSubmit({ date, reason })}
            disabled={!date || !reason.trim()}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white
                       rounded-lg text-sm font-medium transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed">
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendance;
```

---

## 5. HR / ADMIN ATTENDANCE VIEW

The current page (`Attendance.jsx`) is the correct design for HR/Admin. Rename it to `HRAttendance.jsx` and keep it as-is. Just make sure the "Mark Attendance" button and department filters remain.

If you need to create `HRAttendance.jsx` from scratch, it should contain:

```jsx
// HRAttendance.jsx — this is what the current page already shows
// Keep:
//   ✅ Mark Attendance button (top right)
//   ✅ Total Employees / Present Today / Absent Today stat cards
//   ✅ Search employee name input
//   ✅ All Departments dropdown
//   ✅ All Status dropdown
//   ✅ All Mode dropdown
//   ✅ Date range pickers
//   ✅ Reset button
//   ✅ Employee | Department | Date | Check In | Check Out | Work Mode | Working Hours | Status table

// The current page design is CORRECT for HR/Admin
// Just make sure it is NOT shown to employees
```

---

## 6. ROUTE CONFIGURATION

Update `src/App.jsx` to use the role router:

```jsx
import Attendance from './pages/attendance/Attendance';

// In your routes:
<Route path="/attendance" element={
  <ProtectedRoute allowedRoles={['employee','hr','admin','superAdmin']}>
    <Attendance />   {/* This now routes to correct view by role */}
  </ProtectedRoute>
} />
```

No other route changes needed. The `Attendance.jsx` router handles the split internally.

---

## 7. BACKEND API CHANGES

Add these two employee-specific endpoints if they don't exist:

### Monthly summary for own attendance

```javascript
// GET /api/v1/attendance/my-summary
// Returns current month stats for the logged-in user only
router.get('/my-summary', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const now    = new Date();
    const start  = new Date(now.getFullYear(), now.getMonth(), 1);
    const end    = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const records = await Attendance.find({
      employeeId: userId,
      date: { $gte: start, $lte: end },
    });

    const summary = {
      present:  records.filter(r => r.status === 'present').length,
      absent:   records.filter(r => r.status === 'absent').length,
      halfDay:  records.filter(r => r.status === 'half_day').length,
      wfh:      records.filter(r => r.location?.type === 'home').length,
      onLeave:  records.filter(r => r.status === 'on_leave').length,
      total:    records.length,
    };

    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
```

### Own attendance history

```javascript
// GET /api/v1/attendance/my-history?limit=20&page=1
// Returns own attendance records only — employee cannot see others
router.get('/my-history', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit  = parseInt(req.query.limit) || 20;
    const page   = parseInt(req.query.page)  || 1;

    const records = await Attendance.find({ employeeId: userId })
      .sort({ date: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments({ employeeId: userId });

    res.json({
      success: true,
      data:    records,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
```

### Protect existing records endpoint from employees

```javascript
// GET /api/v1/attendance/records — only HR/Admin can see all
router.get('/records', authenticate, async (req, res) => {
  try {
    // If employee, redirect to own records only
    if (req.user.role === 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Employees can only view their own attendance. Use /my-history.',
      });
    }

    // HR, Admin, SuperAdmin — see all with filters
    const { employeeId, startDate, endDate, status, department } = req.query;
    const filter = {};
    if (employeeId) filter.employeeId = employeeId;
    if (status)     filter.status     = status;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(endDate);
    }

    const records = await Attendance.find(filter)
      .populate('employeeId', 'firstName lastName department')
      .sort({ date: -1 })
      .limit(100);

    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
```

---

## SUMMARY — WHAT TO DO

```
Step 1 — Create Attendance.jsx (role router)
  → Checks user.role
  → employee    → renders EmployeeAttendance
  → hr/admin/SA → renders HRAttendance

Step 2 — Rename current Attendance.jsx → HRAttendance.jsx
  → Keep all existing HR/Admin UI unchanged
  → This is the CORRECT view — just for wrong role currently

Step 3 — Create EmployeeAttendance.jsx
  → Paste the complete component from Section 4
  → Shows: own today status + monthly summary + clock in/out + own history
  → Does NOT show: Mark Attendance, all departments, all employees table

Step 4 — Add two backend endpoints
  → GET /api/v1/attendance/my-summary
  → GET /api/v1/attendance/my-history
  → Protect /records from employee role

Step 5 — Update App.jsx route
  → /attendance → Attendance.jsx (role router)
  → No other changes needed
```

---

## BEFORE vs AFTER

```
BEFORE (wrong):
  Employee visits /attendance
  → Sees: Attendance Management + Mark Attendance button
          + Total/Present/Absent cards for ALL employees
          + Search employee name... filter
          + All Departments dropdown
          + Full employees table ❌

AFTER (correct):
  Employee visits /attendance
  → Sees: My Attendance
          + Today's status (own)
          + This month summary (own)
          + Leave balance (own)
          + Clock In / Clock Out buttons
          + Own history table
          + Request Regularization link ✅

  HR/Admin visits /attendance
  → Sees: Attendance Management (same as before, unchanged) ✅
```

---

*Employee should NEVER see "Mark Attendance" or other employees' data.*
*The fix is a role router — no changes to the existing HR view needed.*
