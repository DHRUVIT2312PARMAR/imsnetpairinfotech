# Master Role Implementation Guide
## NetPair IMS — Complete Role-Based System Design

**Version:** 2.1.0
**Changes from v2.0:**
- Role Management → Admin FULL CRUD + SuperAdmin Advanced view/override
- Projects → HR FULL CRUD + SuperAdmin Advanced only
- Announcements → SuperAdmin + Admin + HR can send to all/specific roles; Employee view only
- Settings → SuperAdmin all+edit, Admin system settings+edit, HR personal+view, Employee personal only
**Philosophy:** Employee = own tasks · HR = people operations · Admin = system operations · SuperAdmin = all approvals + advanced full control
**Last Updated:** March 2026

---

## TABLE OF CONTENTS

1. [Role Philosophy](#1-role-philosophy)
2. [SuperAdmin — Approvals + Advanced Control](#2-superadmin--approvals--advanced-control)
3. [Admin — System Operations](#3-admin--system-operations)
4. [HR — People Operations](#4-hr--people-operations)
5. [Employee — Own Workspace](#5-employee--own-workspace)
6. [Module Ownership Matrix](#6-module-ownership-matrix)
7. [Attendance — Cross-Check + Day Calculation](#7-attendance--cross-check--day-calculation)
8. [Salary Cutoff System](#8-salary-cutoff-system)
9. [Tasks & Timesheet — Employee Format](#9-tasks--timesheet--employee-format)
10. [Leave System — All Roles](#10-leave-system--all-roles)
11. [Helpdesk — Layered Access](#11-helpdesk--layered-access)
12. [Policies — Admin Manage + SuperAdmin Approve](#12-policies--admin-manage--superadmin-approve)
13. [Announcements — Role-Targeted Sending](#13-announcements--role-targeted-sending)
14. [Settings — Role-Filtered Views](#14-settings--role-filtered-views)
15. [Navigation & Dashboard Per Role](#15-navigation--dashboard-per-role)
16. [API Endpoint Ownership](#16-api-endpoint-ownership)
17. [Frontend Implementation Rules](#17-frontend-implementation-rules)

---

## 1. ROLE PHILOSOPHY

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ROLE PHILOSOPHY                                 │
│                                                                     │
│  EMPLOYEE    →  Own tasks, own attendance, own leave, own profile   │
│                                                                     │
│  HR          →  People operations — manage all employees,           │
│                 attendance, leave, payroll, projects, assets        │
│                                                                     │
│  ADMIN       →  System operations — CRUD on system modules,         │
│                 HR reports, policies, helpdesk, role management     │
│                                                                     │
│  SUPER ADMIN →  PRIMARY:  See everything + approvals only           │
│                 ADVANCED: Full CRUD on everything                   │
│                 SYSTEM:   Only one who manages system config        │
└─────────────────────────────────────────────────────────────────────┘
```

### Approval Chain

```
Employee applies/requests
      ↓
HR approves (leaves, attendance, employee tasks)
      ↓
Admin approves (policies, HR reports, system requests, role changes)
      ↓
SuperAdmin final approval (system config, critical operations)
```

### Two modes for SuperAdmin

```
PRIMARY MODE (default view):
  - See all dashboards, all data, all reports
  - Approve or reject anything at any level
  - Cannot directly edit — only view + approve
  - Can send announcements (to all or specific roles)

ADVANCED MODE (toggle in dashboard):
  - Full CRUD on every module
  - System configuration
  - Role management (view + override Admin decisions)
  - Audit logs
  - All SuperAdmin operations
```

---

## 2. SUPERADMIN — APPROVALS + ADVANCED CONTROL

### Primary Mode (Default)

```
What SuperAdmin SEES in primary mode:
  ✅ Full system dashboard with all metrics
  ✅ All pending approvals across the system
  ✅ All employee data (read-only)
  ✅ All HR operations (read-only)
  ✅ All admin operations (read-only)
  ✅ Approval queue — policies, system changes, critical requests
  ✅ System health and audit trail (view only)
  ✅ All announcements

What SuperAdmin DOES in primary mode:
  ✅ Approve or reject policy changes (submitted by Admin)
  ✅ Approve critical system configuration changes
  ✅ Approve admin-level requests
  ✅ Approve HR-level requests
  ✅ Approve employee-level requests
  ✅ View all reports across all modules
  ✅ Override any approval at any level
  ✅ Send announcements to all roles or specific roles

What SuperAdmin CANNOT DO in primary mode:
  ❌ Cannot directly create/edit/delete records (use Advanced mode)
  ❌ Cannot process payroll directly (HR does this)
  ❌ Cannot manage day-to-day attendance (HR does this)
  ❌ Cannot directly manage roles (use Advanced mode)
```

### Advanced Mode

```
What SuperAdmin DOES in advanced mode:
  ✅ Full CRUD on users — create, edit, delete, deactivate
  ✅ Role management — view + override any Admin role decision
  ✅ Manage system configuration
  ✅ View and export full audit logs
  ✅ Full CRUD on all employees
  ✅ Full CRUD on all attendance records
  ✅ Full CRUD on all leave records
  ✅ Full CRUD on payroll
  ✅ Full CRUD on projects and assets
  ✅ Full CRUD on policies
  ✅ Full CRUD on helpdesk
  ✅ Manage all system settings (all sections + full edit)
  ✅ Access testing interface
  ✅ Manage integrations and API keys
```

### System Config (SuperAdmin Exclusive)

```
SuperAdmin ONLY can:
  ✅ Change application name, logo, timezone
  ✅ Configure email/notification settings
  ✅ Set working hours policy (standard hours, start time)
  ✅ Configure leave types and quotas
  ✅ Set payroll calculation rules
  ✅ Manage department list
  ✅ Manage designation list
  ✅ Configure salary structure components
  ✅ Set attendance cross-check rules
  ✅ Manage API integrations (Brevo, etc.)
  ✅ Database management tools
  ✅ Backup and restore controls
```

### Approval Queue UI

```jsx
const ApprovalQueue = () => (
  <div>
    {/* Policy approvals — submitted by Admin */}
    <section>
      <h3>Pending Policy Approvals ({policyCount})</h3>
      {pendingPolicies.map(policy => (
        <ApprovalCard
          title={policy.title}
          submittedBy={policy.submittedByAdmin}
          onApprove={() => approvePolicy(policy._id)}
          onReject={() => rejectPolicy(policy._id)}
        />
      ))}
    </section>
    <section>
      <h3>System Config Changes ({configCount})</h3>
    </section>
    <section>
      <h3>Critical Operation Requests ({criticalCount})</h3>
    </section>
  </div>
);
```

### Primary ↔ Advanced Toggle

```jsx
const [mode, setMode] = useState('primary');

<div className="flex items-center gap-3">
  <span className="text-sm text-gray-500">
    {mode === 'primary' ? 'Approval Mode' : 'Advanced Mode'}
  </span>
  <button
    onClick={() => setMode(mode === 'primary' ? 'advanced' : 'primary')}
    className={`relative w-12 h-6 rounded-full transition-colors ${
      mode === 'advanced' ? 'bg-red-500' : 'bg-blue-500'
    }`}>
    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
      ${mode === 'advanced' ? 'translate-x-7' : 'translate-x-1'}`} />
  </button>
  {mode === 'advanced' && (
    <span className="text-xs text-red-500 font-medium">
      ⚠ Advanced — Full edit access enabled
    </span>
  )}
</div>
```

---

## 3. ADMIN — SYSTEM OPERATIONS

### What Admin MANAGES

```
✅ Role Management — FULL CRUD
     (assign roles: employee/hr/admin, create role definitions,
      edit permissions, deactivate accounts)
✅ HR Reports — generate, view, export all HR analytics
✅ Policies — create and manage, send to SuperAdmin for approval
✅ Helpdesk — manage all tickets (own + HR + employee tickets)
✅ Inventory — full CRUD
✅ System Reports — generate all operational reports
✅ Settings — system settings sections (view + edit)
✅ Announcements — create and send to all roles or specific roles
✅ Tasks — assign tasks, manage team timesheets
✅ Approve HR requests and employee requests
```

### Role Management — Admin Owns

```
Admin CAN:
  ✅ Assign roles: employee, hr, admin
  ✅ Change existing user roles (employee ↔ hr ↔ admin)
  ✅ Create custom role definitions
  ✅ View all users with their current roles
  ✅ Deactivate/reactivate user accounts
  ✅ Send role change requests upward for superAdmin tier

Admin CANNOT via Role Management:
  ❌ Cannot assign superAdmin role to anyone
  ❌ Cannot demote another admin without SuperAdmin approval
  ❌ Cannot access system configuration
```

### What Admin APPROVES

```
✅ HR requests (escalated from HR)
✅ Employee requests (escalated from Employee)
✅ Policy submissions → sends to SuperAdmin for final approval
✅ Role change requests for employee and HR level
```

### What Admin CANNOT DO

```
❌ Cannot manage system configuration (SuperAdmin only)
❌ Cannot access audit logs (SuperAdmin only)
❌ Cannot process payroll (HR manages)
❌ Cannot manage attendance day-to-day (HR manages)
❌ Cannot approve leave requests (HR manages)
❌ Cannot manage employee records CRUD (HR manages)
❌ Cannot manage assets (HR manages)
❌ Cannot manage projects (HR manages)
❌ Cannot access payroll module (HR manages)
❌ Cannot assign superAdmin role to anyone
```

---

## 4. HR — PEOPLE OPERATIONS

### What HR MANAGES

```
✅ Attendance — view all, mark, edit, approve regularization
✅ Leave — view all requests, approve/reject, edit balances
✅ Payroll — process salary, manage components, generate payslips
✅ Projects — FULL CRUD (create, assign, track, close)
✅ Assets — manage company assets, assign to employees
✅ Employees — full CRUD on employee records
✅ HR Management — department tools, employee lifecycle
✅ WFH Records — manage remote work tracking
✅ Helpdesk — HR and employee tickets
✅ Announcements — create and send to all roles or specific roles
✅ HR-specific reports
✅ Settings — personal settings view only (no system settings edit)
```

### What HR APPROVES

```
✅ Employee leave requests
✅ Attendance regularization requests
✅ Employee WFH requests
✅ Employee task completion (if required)
```

### What HR CANNOT DO

```
❌ Cannot manage Role Management (Admin owns this)
❌ Cannot create or edit policies (Admin manages this)
❌ Cannot approve policies (SuperAdmin approves)
❌ Cannot generate admin-level system reports
❌ Cannot manage system configuration
❌ Cannot access audit logs
❌ Cannot manage inventory (Admin manages this)
❌ Cannot edit system settings (view personal only)
```

---

## 5. EMPLOYEE — OWN WORKSPACE

### What Employee MANAGES

```
✅ Own attendance — clock in, clock out, view history
✅ Own leave — apply, view balance, view history, cancel pending
✅ Own tasks — view assigned tasks, update status, log time
✅ Own timesheet — submit daily task log with hours/minutes/AM-PM
✅ Own profile — update all personal details, upload photo
✅ Own helpdesk tickets — create and track own tickets
✅ View announcements — read only (cannot send)
✅ Settings — personal preferences only
```

### What Employee CANNOT DO

```
❌ Cannot see other employees' data
❌ Cannot see payroll (own payslip via settings only)
❌ Cannot mark attendance for others
❌ Cannot approve anything
❌ Cannot create projects
❌ Cannot manage assets
❌ Cannot access policies management
❌ Cannot generate reports
❌ Cannot send announcements
❌ Cannot access Role Management
❌ Cannot access HR, admin, or system modules
```

---

## 6. MODULE OWNERSHIP MATRIX

```
┌─────────────────────────────┬────────────┬──────────────┬──────────┬──────────┐
│ MODULE                      │ SUPERADMIN │    ADMIN     │    HR    │ EMPLOYEE │
├─────────────────────────────┼────────────┼──────────────┼──────────┼──────────┤
│ SYSTEM CONFIG               │ Full CRUD  │ ❌           │ ❌       │ ❌       │
│ ROLE MANAGEMENT             │ Adv+View   │ FULL CRUD    │ ❌       │ ❌       │
│ AUDIT LOGS                  │ Full view  │ ❌           │ ❌       │ ❌       │
├─────────────────────────────┼────────────┼──────────────┼──────────┼──────────┤
│ EMPLOYEES                   │ Advanced   │ ❌           │ Full CRUD│ Own only │
│ ATTENDANCE                  │ Advanced   │ View+Approve │ Full CRUD│ Own only │
│ LEAVE APPROVAL              │ Advanced   │ View+Approve │ Full CRUD│ Apply    │
│ PAYROLL                     │ Advanced   │ ❌           │ Full CRUD│ Payslip  │
│ PROJECTS                    │ Advanced   │ ❌           │ Full CRUD│ ❌       │
│ ASSETS                      │ Advanced   │ ❌           │ Full CRUD│ ❌       │
│ WFH RECORDS                 │ Advanced   │ View         │ Full CRUD│ Own only │
├─────────────────────────────┼────────────┼──────────────┼──────────┼──────────┤
│ HR REPORTS                  │ View+Appr  │ Full CRUD    │ View     │ ❌       │
│ POLICIES                    │ APPROVE    │ Full CRUD    │ View     │ View     │
│ INVENTORY                   │ Advanced   │ Full CRUD    │ ❌       │ ❌       │
├─────────────────────────────┼────────────┼──────────────┼──────────┼──────────┤
│ ANNOUNCEMENTS               │ Send+View  │ Send+View    │ Send+View│ View     │
│ (All / Specific role target)│ ✅         │ ✅           │ ✅       │ Only     │
├─────────────────────────────┼────────────┼──────────────┼──────────┼──────────┤
│ HELPDESK                    │ All tickets│ Own+HR+Emp   │ HR+Emp   │ Own only │
│ TASKS & TIMESHEET           │ Advanced   │ Assign+View  │ ❌       │ Own log  │
│ NOTIFICATIONS               │ All        │ All          │ All      │ Own      │
├─────────────────────────────┼────────────┼──────────────┼──────────┼──────────┤
│ OWN PROFILE                 │ ✅         │ ✅           │ ✅       │ ✅       │
│ CLOCK IN/OUT                │ ✅         │ ✅           │ ✅       │ ✅       │
│ APPLY LEAVE                 │ ✅         │ ✅           │ ✅       │ ✅       │
├─────────────────────────────┼────────────┼──────────────┼──────────┼──────────┤
│ SETTINGS                    │ All+Edit   │ System+Edit  │ Personal │ Personal │
│                             │            │              │ +View    │ Only     │
└─────────────────────────────┴────────────┴──────────────┴──────────┴──────────┘

Legend:
  Full CRUD  = Create, Read, Update, Delete
  Advanced   = SuperAdmin Advanced mode only
  Adv+View   = View in primary, CRUD in advanced
  View+      = View + approve/reject
  Send+View  = Can create + send + view announcements
  Own only   = Only their own records
  Payslip    = Own payslip via Settings only
```

---

## 7. ATTENDANCE — CROSS-CHECK + DAY CALCULATION

### Cross-Check Validation Rules

```javascript
const ATTENDANCE_RULES = {
  STANDARD_START:     '09:00',
  STANDARD_END:       '18:00',
  FULL_DAY_HOURS:     8,
  HALF_DAY_MIN:       4,
  LATE_GRACE_MINUTES: 15,
  OVERTIME_AFTER:     8,
};

const crossCheckAttendance = async (userId, action, timestamp) => {
  const today = new Date().toDateString();

  // Rule 1 — Cannot clock in twice in same day
  if (action === 'clock-in') {
    const existing = await Attendance.findOne({
      userId, date: today, checkIn: { $exists: true },
    });
    if (existing) throw new Error('Already clocked in today');
  }

  // Rule 2 — Must clock in before clocking out
  if (action === 'clock-out') {
    const record = await Attendance.findOne({ userId, date: today });
    if (!record?.checkIn) throw new Error('Must clock in before clocking out');
    if (record?.checkOut)  throw new Error('Already clocked out today');
  }

  // Rule 3 — Clock-out must be after clock-in
  if (action === 'clock-out') {
    const record = await Attendance.findOne({ userId, date: today });
    if (timestamp <= record.checkIn)
      throw new Error('Clock-out cannot be before or equal to clock-in time');
  }

  // Rule 4 — No future entries
  if (timestamp > new Date())
    throw new Error('Cannot record future attendance');

  // Rule 5 — Employee cannot modify past attendance
  const user = await User.findById(userId);
  if (user.role === 'employee') {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (new Date(timestamp) < yesterday)
      throw new Error('Cannot modify past attendance. Request regularization.');
  }

  return true;
};
```

### Day Type Calculation

```javascript
function calculateDayType(checkIn, checkOut, breaks = []) {
  const totalBreakMinutes = breaks.reduce((acc, b) => {
    if (b.startTime && b.endTime)
      return acc + (new Date(b.endTime) - new Date(b.startTime)) / 60000;
    return acc;
  }, 0);

  const totalMinutes   = (new Date(checkOut) - new Date(checkIn)) / 60000;
  const workingMinutes = totalMinutes - totalBreakMinutes;
  const workingHours   = workingMinutes / 60;

  if (workingHours >= 8) {
    return {
      dayType: 'full_day', status: 'present',
      workingHours:  parseFloat(workingHours.toFixed(2)),
      overtimeHours: parseFloat(Math.max(0, workingHours - 8).toFixed(2)),
    };
  }

  if (workingHours >= 4) {
    return {
      dayType: 'half_day', status: 'half_day',
      workingHours: parseFloat(workingHours.toFixed(2)),
      overtimeHours: 0,
    };
  }

  // Less than 4h — counted as leave but actual hours still PAID
  return {
    dayType: 'leave', status: 'absent',
    workingHours: parseFloat(workingHours.toFixed(2)),
    overtimeHours: 0,
    note: 'Worked <4h — counted as leave. Actual hours worked still paid.',
  };
}
```

### Day Type Summary

```
Working Hours     Day Type    Status       Salary Impact
──────────────────────────────────────────────────────────────
≥ 8 hours         Full Day    PRESENT      Full day salary
4 – 7.99 hrs      Half Day    HALF DAY     Half day salary
< 4 hours         Leave       ABSENT       Leave deducted (hours still paid)
Overtime (> 8h)   Full Day+   PRESENT+OT   Full + OT at 1.5x rate
```

---

## 8. SALARY CUTOFF SYSTEM

### Minute-Wise Calculation

```javascript
const WORKING_DAYS_PER_MONTH = 26;
const STANDARD_DAILY_HOURS   = 8;
const STANDARD_MONTHLY_HOURS = WORKING_DAYS_PER_MONTH * STANDARD_DAILY_HOURS; // 208h

/**
 * KEY RULE:
 * - <4h days counted as LEAVE for leave balance
 * - BUT actual hours worked ARE STILL PAID
 * - Only absent portion (from standard 8h) is deducted
 */
function calculateMonthlySalary(employee, attendanceRecords, leaves) {
  const basicSalary  = employee.compensation.basicSalary;
  const perMinutePay = basicSalary / (STANDARD_MONTHLY_HOURS * 60);

  let totalPaidMinutes = 0, totalDeductMinutes = 0, overtimeMinutes = 0;
  let fullDays = 0, halfDays = 0, leaveDays = 0, leaveDeductDays = 0;

  for (const record of attendanceRecords) {
    const workMinutes        = record.workingMinutes || 0;
    const standardDayMinutes = STANDARD_DAILY_HOURS * 60; // 480

    if (record.dayType === 'full_day') {
      fullDays++;
      totalPaidMinutes += standardDayMinutes;
      overtimeMinutes  += record.overtimeMinutes || 0;

    } else if (record.dayType === 'half_day') {
      halfDays++;
      totalPaidMinutes   += 4 * 60;
      totalDeductMinutes += 4 * 60;

    } else if (record.dayType === 'leave') {
      // <4h: leave for records, but PAY actual minutes worked
      leaveDays++;
      leaveDeductDays++;
      totalPaidMinutes   += workMinutes;
      totalDeductMinutes += Math.max(0, standardDayMinutes - workMinutes);

    } else if (record.status === 'absent' && !record.workingMinutes) {
      leaveDays++;
      totalDeductMinutes += standardDayMinutes;

    } else if (record.status === 'on_leave') {
      fullDays++;
      totalPaidMinutes += standardDayMinutes; // paid leave — no deduction
    }
  }

  // Unpaid leave deductions
  for (const leave of leaves) {
    if (leave.leaveType === 'unpaid' && leave.status === 'approved')
      totalDeductMinutes += leave.days * STANDARD_DAILY_HOURS * 60;
  }

  const grossPay    = totalPaidMinutes * perMinutePay;
  const deduction   = totalDeductMinutes * perMinutePay;
  const overtimePay = overtimeMinutes * (perMinutePay * 1.5);
  const netSalary   = grossPay - deduction + overtimePay;

  return {
    basicSalary,
    grossPay:    parseFloat(grossPay.toFixed(2)),
    deduction:   parseFloat(deduction.toFixed(2)),
    overtimePay: parseFloat(overtimePay.toFixed(2)),
    netSalary:   parseFloat(netSalary.toFixed(2)),
    perMinutePay: parseFloat(perMinutePay.toFixed(4)),
    summary: { fullDays, halfDays, leaveDays, leaveDeductDays,
               totalPaidMinutes, totalDeductMinutes, overtimeMinutes },
  };
}
```

### Payslip Display

```
┌──────────────────────────────────────────────────────────────┐
│  NETPAIR INFOTECH — PAYSLIP                                  │
│  Employee: Ashish Girase    Month: March 2026                │
├─────────────────────────────┬────────────────────────────────┤
│  EARNINGS                   │  DEDUCTIONS                    │
│  Basic Salary    ₹25,000    │  Late Deduction     ₹540       │
│  HRA             ₹8,000     │  Leave Deduction    ₹1,923     │
│  Transport Allow ₹2,000     │  PF (12%)           ₹3,000     │
│  Overtime Pay    ₹350       │  TDS                ₹0         │
├─────────────────────────────┴────────────────────────────────┤
│  ATTENDANCE: 26 days | Full: 22 | Half: 2 | Leave: 2        │
│  Per Minute Rate: ₹2.0042  |  Overtime: 45 min              │
│  Gross: ₹35,350  |  Deduction: ₹5,463  |  NET: ₹29,887     │
└──────────────────────────────────────────────────────────────┘
```

---

## 9. TASKS & TIMESHEET — EMPLOYEE FORMAT

### Entry UI

```
┌──────────────────────────────────────────────────────────────┐
│  TODAY'S TIMESHEET — Wednesday, 19 March 2026               │
├──────────────────────────────────────────────────────────────┤
│  Task Description                                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Completed the login API integration with JWT         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────┐  ┌───────────────┐  ┌─────────────┐  │
│  │  ⏱ Hours    ▼    │  │  Minutes  ▼   │  │  AM / PM    │  │
│  │  [  02  ]        │  │  [  30  ]     │  │  [AM] [PM]  │  │
│  └──────────────────┘  └───────────────┘  └─────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  NetPair IMS — Auth Module                        ▼   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [  + Add to Timesheet  ]                                    │
└──────────────────────────────────────────────────────────────┘
```

### TimesheetEntry Component

```jsx
import { useState } from 'react';

const HOURS    = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES  = ['00','05','10','15','20','25','30','35','40','45','50','55'];
const MERIDIEM = ['AM', 'PM'];

const TimesheetEntry = ({ projects, onAdd }) => {
  const [task, setTask]       = useState('');
  const [hour, setHour]       = useState('01');
  const [minute, setMinute]   = useState('00');
  const [ampm, setAmpm]       = useState('AM');
  const [project, setProject] = useState('');
  const [error, setError]     = useState('');

  const handleAdd = () => {
    if (!task.trim())  { setError('Please describe the task'); return; }
    if (!project)      { setError('Please select a project'); return; }
    setError('');

    onAdd({
      description:   task.trim(),
      hour:          parseInt(hour),
      minute:        parseInt(minute),
      meridiem:      ampm,
      totalMinutes:  (parseInt(hour) * 60) + parseInt(minute),
      timeFormatted: `${hour}h ${minute}m`,
      projectId:     project,
      loggedAt:      new Date().toISOString(),
    });

    setTask(''); setHour('01'); setMinute('00'); setAmpm('AM'); setProject('');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Log Today's Task</h3>

      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Task Description <span className="text-red-500">*</span>
        </label>
        <textarea value={task} onChange={e => setTask(e.target.value)}
          placeholder="Describe what you worked on..." rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Hours</label>
          <div className="relative">
            <select value={hour} onChange={e => setHour(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white">
              {HOURS.map(h => <option key={h} value={h}>{h} hr</option>)}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🕐</span>
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Minutes</label>
          <select value={minute} onChange={e => setMinute(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:ring-2 focus:ring-blue-500 outline-none">
            {MINUTES.map(m => <option key={m} value={m}>{m} min</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Period</label>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            {MERIDIEM.map(m => (
              <button key={m} type="button" onClick={() => setAmpm(m)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  ampm === m ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}>
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Project / Task <span className="text-red-500">*</span>
        </label>
        <select value={project} onChange={e => setProject(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">Select project or task...</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

      <button onClick={handleAdd}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm
                   font-medium py-2.5 rounded-lg transition-colors">
        + Add to Timesheet
      </button>
    </div>
  );
};
export default TimesheetEntry;
```

### Timesheet Table

```jsx
const TimesheetTable = ({ entries }) => {
  const totalMinutes = entries.reduce((acc, e) => acc + e.totalMinutes, 0);
  const totalHours   = Math.floor(totalMinutes / 60);
  const totalMins    = totalMinutes % 60;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Today's Timesheet</h3>
        <span className="text-xs text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
          Total: {totalHours}h {totalMins}m
        </span>
      </div>
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50">
            {['#','Task Description','Project','Time Logged','Status','Logged At',''].map(h => (
              <th key={h} className="text-left text-xs font-medium text-gray-500
                                     px-6 py-3 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((entry, idx) => (
            <tr key={entry._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-400">{idx + 1}</td>
              <td className="px-6 py-4 text-sm text-gray-800 max-w-xs">{entry.description}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{entry.projectName || '—'}</td>
              <td className="px-6 py-4">
                <span className="text-sm font-medium text-blue-600">
                  {entry.hour}h {String(entry.minute).padStart(2,'0')}m {entry.meridiem}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full
                  text-xs font-medium ${
                    entry.status === 'completed'   ? 'bg-green-100 text-green-800' :
                    entry.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                                     'bg-gray-100 text-gray-600'
                  }`}>
                  {entry.status || 'Logged'}
                </span>
              </td>
              <td className="px-6 py-4 text-xs text-gray-400">
                {new Date(entry.loggedAt).toLocaleTimeString()}
              </td>
              <td className="px-6 py-4">
                <button className="text-red-400 hover:text-red-600 text-xs">Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50">
            <td colSpan={3} className="px-6 py-3 text-xs font-medium text-gray-500">
              {entries.length} task{entries.length !== 1 ? 's' : ''} logged today
            </td>
            <td className="px-6 py-3 text-sm font-semibold text-blue-700">
              {totalHours}h {totalMins}m
            </td>
            <td colSpan={3}></td>
          </tr>
        </tfoot>
      </table>
      {entries.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          No tasks logged yet today. Add your first task above.
        </div>
      )}
    </div>
  );
};
```

### Timesheet Schema

```javascript
const TimesheetSchema = new mongoose.Schema({
  employeeId:   { type: ObjectId, ref: 'Employee', required: true },
  date:         { type: Date, required: true },
  description:  { type: String, required: true, maxlength: 500 },
  hour:         { type: Number, min: 0, max: 12 },
  minute:       { type: Number, min: 0, max: 59 },
  meridiem:     { type: String, enum: ['AM', 'PM'] },
  totalMinutes: { type: Number, required: true },
  projectId:    { type: ObjectId, ref: 'Project' },
  projectName:  { type: String },
  taskId:       { type: ObjectId, ref: 'Task' },
  status: {
    type: String,
    enum: ['logged','in-progress','completed','pending-review'],
    default: 'logged',
  },
  loggedAt:   { type: Date, default: Date.now },
  approvedBy: { type: ObjectId, ref: 'User' },
  approvedAt: { type: Date },
}, { timestamps: true });
```

---

## 10. LEAVE SYSTEM — ALL ROLES

### Flow by role

```
EMPLOYEE → Apply, cancel pending, view balance/history
HR       → View all, approve/reject, edit balances, view calendar
ADMIN    → View reports, view calendar (read only)
SUPERADMIN → Override any decision, configure leave types in system config
```

### Leave types

```javascript
const LEAVE_TYPES = {
  annual:    { daysPerYear: 12, isPaid: true,  carryForward: true,  maxCarry: 6 },
  sick:      { daysPerYear: 8,  isPaid: true,  carryForward: false, maxCarry: 0 },
  casual:    { daysPerYear: 6,  isPaid: true,  carryForward: false, maxCarry: 0 },
  unpaid:    { daysPerYear: 0,  isPaid: false, carryForward: false, maxCarry: 0 },
  maternity: { daysPerYear: 90, isPaid: true,  carryForward: false, maxCarry: 0 },
  paternity: { daysPerYear: 5,  isPaid: true,  carryForward: false, maxCarry: 0 },
};
```

---

## 11. HELPDESK — LAYERED ACCESS

### Who sees what

```javascript
const getHelpdeskFilter = (user) => {
  switch (user.role) {
    case 'superAdmin': return {};
    case 'admin':
      return { $or: [
        { createdBy: user._id },
        { creatorRole: 'hr' },
        { creatorRole: 'employee' },
      ]};
    case 'hr':
      return { $or: [
        { createdBy: user._id },
        { creatorRole: 'hr' },
        { creatorRole: 'employee' },
      ]};
    case 'employee':
      return { createdBy: user._id };
    default:
      return { createdBy: user._id };
  }
};
```

### Helpdesk summary

```
SuperAdmin  → ALL tickets (every role)
Admin       → Own + all HR tickets + all employee tickets
HR          → Own + all HR tickets + all employee tickets
Employee    → Own tickets only
```

---

## 12. POLICIES — ADMIN MANAGE + SUPERADMIN APPROVE

### Workflow

```
ADMIN creates draft → submits → SuperAdmin reviews
      ↓
SuperAdmin APPROVES → policy ACTIVE (visible to all)
SuperAdmin REJECTS  → back to Admin with comment
      ↓
HR and Employee: view APPROVED policies only (no edit)
```

### Status enum

```javascript
status: {
  type: String,
  enum: ['draft','pending_approval','approved','rejected','archived'],
  default: 'draft',
}
```

### Frontend filter

```jsx
const getPoliciesForRole = (role, policies) => {
  if (['admin', 'superAdmin'].includes(role)) return policies;  // all statuses
  return policies.filter(p => p.status === 'approved');         // approved only
};

const canManagePolicies  = ['admin', 'superAdmin'].includes(user.role);
const canApprovePolicies = user.role === 'superAdmin';
```

---

## 13. ANNOUNCEMENTS — ROLE-TARGETED SENDING

### Who can SEND

```
SuperAdmin  ✅ Send to all or target specific roles
Admin       ✅ Send to all or target specific roles
HR          ✅ Send to all or target specific roles
Employee    ❌ View only — cannot send
```

### Target audience options

```
When composing (shown to SuperAdmin, Admin, HR):
  ○ All employees         → targetRoles: ['all']
  ○ Employees only        → targetRoles: ['employee']
  ○ HR only               → targetRoles: ['hr']
  ○ Admins only           → targetRoles: ['admin']
  ○ HR + Employees        → targetRoles: ['hr', 'employee']
  ○ Custom multi-select   → any combination of roles
```

### Announcement Schema

```javascript
const AnnouncementSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  content:     { type: String, required: true },
  createdBy:   { type: ObjectId, ref: 'User', required: true },
  creatorRole: { type: String },
  targetRoles: {
    type: [String],
    enum: ['all', 'employee', 'hr', 'admin', 'superAdmin'],
    default: ['all'],
  },
  isPinned:    { type: Boolean, default: false },
  isActive:    { type: Boolean, default: true },
  expiresAt:   { type: Date },
  attachments: [{ name: String, url: String, type: String }],
  readBy:      [{ userId: ObjectId, readAt: Date }],
}, { timestamps: true });
```

### Backend filter — what each role sees

```javascript
const getAnnouncementsForRole = (userRole) => ({
  isActive: true,
  $or: [
    { targetRoles: 'all' },
    { targetRoles: userRole },
  ],
});
// Employee  → sees announcements targeted to 'all' or 'employee'
// HR        → sees 'all' + 'hr' + 'employee'
// Admin     → sees 'all' + 'admin' + 'hr' + 'employee'
// SuperAdmin→ all announcements
```

### Announcement Composer (SuperAdmin, Admin, HR)

```jsx
const AnnouncementComposer = () => {
  const [title, setTitle]     = useState('');
  const [content, setContent] = useState('');
  const [targets, setTargets] = useState(['all']);
  const [isPinned, setIsPinned] = useState(false);

  const TARGET_OPTIONS = [
    { value: 'all',      label: 'All Employees' },
    { value: 'employee', label: 'Employees only' },
    { value: 'hr',       label: 'HR only' },
    { value: 'admin',    label: 'Admins only' },
  ];

  const toggleTarget = (val) => {
    if (val === 'all') { setTargets(['all']); return; }
    setTargets(prev =>
      prev.includes(val)
        ? prev.filter(t => t !== val && t !== 'all')
        : [...prev.filter(t => t !== 'all'), val]
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-base font-semibold text-gray-800 mb-4">Create Announcement</h3>

      <input value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Announcement title"
        className="w-full border border-gray-300 rounded-lg px-3 py-2
                   text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-3" />

      <textarea value={content} onChange={e => setContent(e.target.value)}
        placeholder="Write your announcement here..." rows={4}
        className="w-full border border-gray-300 rounded-lg px-3 py-2
                   text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-4" />

      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">Send to</label>
        <div className="flex flex-wrap gap-2">
          {TARGET_OPTIONS.map(opt => (
            <button key={opt.value} type="button" onClick={() => toggleTarget(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                targets.includes(opt.value)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 mb-4 cursor-pointer">
        <input type="checkbox" checked={isPinned}
          onChange={e => setIsPinned(e.target.checked)} className="rounded" />
        <span className="text-xs text-gray-600">Pin this announcement</span>
      </label>

      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm
                         font-medium py-2.5 rounded-lg transition-colors">
        Publish Announcement
      </button>
    </div>
  );
};
```

### Announcement API

```javascript
// Send — SuperAdmin, Admin, HR
router.post('/announcements',   authenticate, restrictTo('hr','admin','superAdmin'), create);
// View — all (filtered)
router.get('/announcements',    authenticate, getFiltered);
// Edit — creator or superAdmin
router.put('/announcements/:id', authenticate, restrictTo('hr','admin','superAdmin'), update);
// Delete — admin, superAdmin
router.delete('/announcements/:id', authenticate, restrictTo('admin','superAdmin'), remove);
```

---

## 14. SETTINGS — ROLE-FILTERED VIEWS

### What each role sees

```
┌────────────────────────────────┬────────────┬──────────────┬──────────┬──────────┐
│ SETTINGS SECTION               │ SUPERADMIN │    ADMIN     │    HR    │ EMPLOYEE │
├────────────────────────────────┼────────────┼──────────────┼──────────┼──────────┤
│ Change password                │ ✅ Edit    │ ✅ Edit      │ ✅ Edit  │ ✅ Edit  │
│ Notification preferences       │ ✅ Edit    │ ✅ Edit      │ ✅ Edit  │ ✅ Edit  │
│ Theme (light/dark)             │ ✅ Edit    │ ✅ Edit      │ ✅ Edit  │ ✅ Edit  │
│ Language preference            │ ✅ Edit    │ ✅ Edit      │ ✅ Edit  │ ✅ Edit  │
│ Update personal email (OTP)    │ ✅ Edit    │ ✅ Edit      │ ✅ Edit  │ ✅ Edit  │
│ Own payslip history            │ ✅ View    │ ✅ View      │ ✅ View  │ ✅ View  │
├────────────────────────────────┼────────────┼──────────────┼──────────┼──────────┤
│ Department list                │ ✅ Edit    │ ✅ Edit      │ 👁 View  │ ❌       │
│ Designation list               │ ✅ Edit    │ ✅ Edit      │ 👁 View  │ ❌       │
│ Leave type view                │ ✅ Edit    │ ✅ Edit      │ 👁 View  │ ❌       │
│ Working hours policy           │ ✅ Edit    │ ✅ Edit      │ 👁 View  │ ❌       │
│ Notification templates         │ ✅ Edit    │ ✅ Edit      │ 👁 View  │ ❌       │
├────────────────────────────────┼────────────┼──────────────┼──────────┼──────────┤
│ System infrastructure settings │ ✅ Edit    │ ✅ Edit      │ ❌       │ ❌       │
│ Helpdesk categories            │ ✅ Edit    │ ✅ Edit      │ ❌       │ ❌       │
│ Report export formats          │ ✅ Edit    │ ✅ Edit      │ ❌       │ ❌       │
│ Announcement settings          │ ✅ Edit    │ ✅ Edit      │ ❌       │ ❌       │
│ Inventory categories           │ ✅ Edit    │ ✅ Edit      │ ❌       │ ❌       │
├────────────────────────────────┼────────────┼──────────────┼──────────┼──────────┤
│ Payroll calculation rules      │ ✅ Edit    │ ❌           │ ❌       │ ❌       │
│ Salary structure components    │ ✅ Edit    │ ❌           │ ❌       │ ❌       │
│ API integrations               │ ✅ Edit    │ ❌           │ ❌       │ ❌       │
│ Database management            │ ✅ Edit    │ ❌           │ ❌       │ ❌       │
│ Backup and restore             │ ✅ Edit    │ ❌           │ ❌       │ ❌       │
│ Security settings              │ ✅ Edit    │ ❌           │ ❌       │ ❌       │
│ Email server configuration     │ ✅ Edit    │ ❌           │ ❌       │ ❌       │
│ Attendance cross-check rules   │ ✅ Edit    │ ❌           │ ❌       │ ❌       │
└────────────────────────────────┴────────────┴──────────────┴──────────┴──────────┘

✅ = visible + editable   👁 = visible, read-only   ❌ = hidden completely

Summary:
  SuperAdmin → ALL sections + full edit
  Admin      → Personal + HR config + System settings (edit all visible)
  HR         → Personal (edit) + HR config (view only)
  Employee   → Personal only (edit)
```

### Settings section config

```javascript
const SETTINGS_SECTIONS = {
  personal: {
    label:    'Personal Preferences',
    roles:    ['employee','hr','admin','superAdmin'],
    editable: ['employee','hr','admin','superAdmin'],
  },
  hrConfig: {
    label:    'HR Configuration',
    roles:    ['hr','admin','superAdmin'],
    editable: ['admin','superAdmin'],         // HR views, Admin/SA edits
  },
  systemConfig: {
    label:    'System Settings',
    roles:    ['admin','superAdmin'],
    editable: ['admin','superAdmin'],         // Both Admin and SuperAdmin edit
  },
  advanced: {
    label:    'Advanced Configuration',
    roles:    ['superAdmin'],
    editable: ['superAdmin'],                 // SuperAdmin only
  },
};

const visibleSections = Object.entries(SETTINGS_SECTIONS)
  .filter(([, sec]) => sec.roles.includes(user.role))
  .map(([key, sec]) => ({
    ...sec, key,
    canEdit: sec.editable.includes(user.role),
  }));
```

---

## 15. NAVIGATION & DASHBOARD PER ROLE

### Full navigation map

```javascript
const NAV_ITEMS = [
  // ── All roles ─────────────────────────────────────────────
  { path: '/dashboard',       label: 'Dashboard',         roles: null },
  { path: '/attendance',      label: 'Attendance',         roles: null },
  { path: '/leave',           label: 'Leave',              roles: null },
  { path: '/helpdesk',        label: 'Helpdesk',           roles: null },
  { path: '/announcements',   label: 'Announcements',      roles: null },   // send vs view filtered inside
  { path: '/notifications',   label: 'Notifications',      roles: null },
  { path: '/settings',        label: 'Settings',           roles: null },   // sections filtered inside

  // ── Employee + Admin + SuperAdmin ──────────────────────────
  { path: '/tasks-timesheet', label: 'Tasks & Timesheet',
    roles: ['employee','admin','superAdmin'] },

  // ── HR + Admin + SuperAdmin ────────────────────────────────
  { path: '/employees',       label: 'Employees',          roles: ['hr','admin','superAdmin'] },
  { path: '/hr-management',   label: 'HR Management',      roles: ['hr','admin','superAdmin'] },
  { path: '/wfh',             label: 'WFH Records',        roles: ['hr','admin','superAdmin'] },

  // ── HR + SuperAdmin ────────────────────────────────────────
  { path: '/payroll',         label: 'Payroll',            roles: ['hr','superAdmin'] },
  { path: '/projects',        label: 'Projects',           roles: ['hr','superAdmin'] },     // HR owns
  { path: '/assets',          label: 'Assets',             roles: ['hr','superAdmin'] },

  // ── Admin + SuperAdmin ─────────────────────────────────────
  { path: '/reports',         label: 'Reports',            roles: ['admin','superAdmin'] },
  { path: '/policies',        label: 'Policies',           roles: ['admin','superAdmin'] },
  { path: '/inventory',       label: 'Inventory',          roles: ['admin','superAdmin'] },
  { path: '/role-management', label: 'Role Management',    roles: ['admin','superAdmin'] },  // Admin manages

  // ── SuperAdmin only ────────────────────────────────────────
  { path: '/audit-logs',           label: 'Audit Logs',    roles: ['superAdmin'] },
  { path: '/system-configuration', label: 'System Config', roles: ['superAdmin'] },
  { path: '/testing',              label: 'Testing',       roles: ['superAdmin'] },
];
```

### Dashboard routing

```javascript
const RoleBasedDashboard = () => {
  const { user }    = useAuth();
  const [mode, setMode] = useState('primary');

  if (user.role === 'superAdmin') return <SuperAdminDashboard mode={mode} onModeChange={setMode} />;
  if (user.role === 'admin')      return <AdminDashboard />;
  if (user.role === 'hr')         return <HRDashboard />;
  if (user.role === 'employee')   return <EmployeeDashboard />;

  return <Navigate to="/" replace />;
};
```

---

## 16. API ENDPOINT OWNERSHIP

```
SYSTEM (SuperAdmin only)
  GET/PUT   /api/v1/system/config              superAdmin
  GET       /api/v1/audit-logs                 superAdmin

ROLE MANAGEMENT (Admin manages + SuperAdmin override)
  GET       /api/v1/roles                      admin, superAdmin
  PUT       /api/v1/users/:id/role             admin (emp/hr/admin roles), superAdmin (all)
  POST      /api/v1/roles                      admin, superAdmin
  DELETE    /api/v1/roles/:id                  superAdmin

EMPLOYEES (HR + SuperAdmin)
  GET       /api/v1/employees                  hr, admin, superAdmin
  POST      /api/v1/employees                  hr, superAdmin
  PUT       /api/v1/employees/:id              hr, superAdmin
  DELETE    /api/v1/employees/:id              hr, superAdmin

ATTENDANCE (HR manages, all clock)
  POST      /api/v1/attendance/clock-in        all (own)
  POST      /api/v1/attendance/clock-out       all (own)
  GET       /api/v1/attendance/today           all (own)
  GET       /api/v1/attendance/records         hr, admin, superAdmin (emp: own only)
  POST      /api/v1/attendance/mark            hr, superAdmin
  POST      /api/v1/attendance/regularization/process  hr, superAdmin

LEAVE (HR approves, all apply)
  POST      /api/v1/leaves                     all (apply own)
  GET       /api/v1/leaves                     hr, admin, superAdmin (emp: own only)
  PUT       /api/v1/leaves/:id/approve         hr, superAdmin
  PUT       /api/v1/leaves/:id/reject          hr, superAdmin

PAYROLL (HR + SuperAdmin)
  GET       /api/v1/payroll                    hr, superAdmin
  POST      /api/v1/payroll/process            hr, superAdmin
  GET       /api/v1/payroll/my-payslips        all (own only)

PROJECTS (HR + SuperAdmin)
  GET/POST  /api/v1/projects                   hr, superAdmin
  PUT/DEL   /api/v1/projects/:id               hr, superAdmin

ASSETS (HR + SuperAdmin)
  GET/POST  /api/v1/assets                     hr, superAdmin
  PUT/DEL   /api/v1/assets/:id                 hr, superAdmin

REPORTS (Admin + SuperAdmin)
  GET       /api/v1/reports/*                  admin, superAdmin

POLICIES (Admin manages, SuperAdmin approves)
  POST      /api/v1/policies                   admin, superAdmin
  PUT       /api/v1/policies/:id               admin, superAdmin
  PUT       /api/v1/policies/:id/approve       superAdmin only
  GET       /api/v1/policies                   all (status filtered)

ANNOUNCEMENTS (SuperAdmin + Admin + HR send; Employee views)
  POST      /api/v1/announcements              hr, admin, superAdmin
  GET       /api/v1/announcements              all (targetRoles filtered)
  PUT       /api/v1/announcements/:id          hr, admin, superAdmin
  DELETE    /api/v1/announcements/:id          admin, superAdmin

HELPDESK (role-filtered content)
  GET       /api/v1/helpdesk                   all (content filtered by role)
  POST      /api/v1/helpdesk                   all (create own)
  PUT       /api/v1/helpdesk/:id               owner, hr, admin, superAdmin

TIMESHEET (Employee logs own)
  POST      /api/v1/timesheet                  all (own)
  GET       /api/v1/timesheet/my               all (own)
  GET       /api/v1/timesheet/team             admin, superAdmin
  PUT       /api/v1/timesheet/:id/approve      admin, superAdmin

SALARY
  POST      /api/v1/salary/calculate-minute    hr, superAdmin
  GET       /api/v1/salary/payslip/:month      all (own only)
```

---

## 17. FRONTEND IMPLEMENTATION RULES

### Role utility helpers

```javascript
// src/utils/roleUtils.js
export const isEmployee     = r => r === 'employee';
export const isHR           = r => r === 'hr';
export const isAdmin        = r => r === 'admin';
export const isSuperAdmin   = r => r === 'superAdmin';
export const isHROrAbove    = r => ['hr','admin','superAdmin'].includes(r);
export const isAdminOrAbove = r => ['admin','superAdmin'].includes(r);

// Updated module-specific helpers (v2.1)
export const canSendAnnouncements  = r => ['hr','admin','superAdmin'].includes(r);
export const canManageRoles        = r => ['admin','superAdmin'].includes(r);      // Admin full CRUD
export const canManageProjects     = r => ['hr','superAdmin'].includes(r);         // HR full CRUD
export const canApproveLeave       = r => ['hr','superAdmin'].includes(r);
export const canManagePayroll      = r => ['hr','superAdmin'].includes(r);
export const canManagePolicies     = r => ['admin','superAdmin'].includes(r);
export const canApprovePolicies    = r => r === 'superAdmin';
export const canEditSystemSettings = r => ['admin','superAdmin'].includes(r);
export const canEditAdvancedConfig = r => r === 'superAdmin';
export const canViewHRConfig       = r => ['hr','admin','superAdmin'].includes(r);
```

### Conditional render patterns

```jsx
import {
  canSendAnnouncements, canManageRoles, canManageProjects,
  canApprovePolicies, canEditSystemSettings, canViewHRConfig,
} from '../utils/roleUtils';

const { user } = useAuth();

{/* Announcement send form — HR + Admin + SuperAdmin */}
{canSendAnnouncements(user.role) && <AnnouncementComposer />}

{/* Projects navigation — HR and SuperAdmin only */}
{canManageProjects(user.role) && <ProjectsLink />}

{/* Role Management — Admin and SuperAdmin */}
{canManageRoles(user.role) && <RoleManagementLink />}

{/* Policy approve button — SuperAdmin only */}
{canApprovePolicies(user.role) && <ApprovePolicyButton />}

{/* System settings section — Admin and SuperAdmin */}
{canEditSystemSettings(user.role) && <SystemSettingsSection />}

{/* HR config view — HR (read), Admin/SA (edit) */}
{canViewHRConfig(user.role) && (
  <HRConfigSection editable={canEditSystemSettings(user.role)} />
)}

{/* These are for everyone */}
<OwnProfileSection />
<ClockInButton />
<ApplyLeaveButton />
```

### ProtectedRoute usage

```jsx
// App.jsx

// Role Management — Admin + SuperAdmin
<Route path="/role-management" element={
  <ProtectedRoute allowedRoles={['admin','superAdmin']}>
    <RoleManagement />
  </ProtectedRoute>
} />

// Projects — HR + SuperAdmin only
<Route path="/projects" element={
  <ProtectedRoute allowedRoles={['hr','superAdmin']}>
    <Projects />
  </ProtectedRoute>
} />

// Payroll — HR + SuperAdmin
<Route path="/payroll" element={
  <ProtectedRoute allowedRoles={['hr','superAdmin']}>
    <Payroll />
  </ProtectedRoute>
} />

// Policies — Admin + SuperAdmin
<Route path="/policies" element={
  <ProtectedRoute allowedRoles={['admin','superAdmin']}>
    <Policies />
  </ProtectedRoute>
} />

// System config — SuperAdmin only
<Route path="/system-configuration" element={
  <ProtectedRoute allowedRoles={['superAdmin']}>
    <SystemConfig />
  </ProtectedRoute>
} />

// Announcements — all access (send vs view handled inside component)
<Route path="/announcements" element={
  <ProtectedRoute allowedRoles={['employee','hr','admin','superAdmin']}>
    <Announcements />
  </ProtectedRoute>
} />

// Settings — all access (sections filtered by role inside component)
<Route path="/settings" element={
  <ProtectedRoute allowedRoles={['employee','hr','admin','superAdmin']}>
    <Settings />
  </ProtectedRoute>
} />
```

---

## MASTER SUMMARY TABLE

```
┌────────────────────────────────────────────────────────────────────────────────┐
│               NETPAIR IMS v2.1 — FINAL ROLE SUMMARY                          │
├──────────────────────┬──────────────┬──────────────┬──────────┬───────────────┤
│ CAPABILITY           │ SUPERADMIN   │    ADMIN     │    HR    │   EMPLOYEE    │
├──────────────────────┼──────────────┼──────────────┼──────────┼───────────────┤
│ System Config        │ FULL         │ ❌           │ ❌       │ ❌            │
│ Role Management      │ Adv+View     │ FULL CRUD ★  │ ❌       │ ❌            │
│ Audit Logs           │ Full view    │ ❌           │ ❌       │ ❌            │
├──────────────────────┼──────────────┼──────────────┼──────────┼───────────────┤
│ Employees            │ Advanced     │ View only    │ FULL ★   │ Own only      │
│ Attendance           │ Advanced     │ View+Approve │ FULL     │ Clock own     │
│ Leave approval       │ Advanced     │ View+Approve │ FULL     │ Apply only    │
│ Payroll              │ Advanced     │ ❌           │ FULL     │ Payslip only  │
│ Projects             │ Advanced     │ ❌ ★         │ FULL ★   │ ❌            │
│ Assets               │ Advanced     │ ❌           │ FULL     │ ❌            │
├──────────────────────┼──────────────┼──────────────┼──────────┼───────────────┤
│ HR Reports           │ View+Approve │ FULL         │ View     │ ❌            │
│ Policies             │ APPROVE only │ FULL CRUD    │ View     │ View          │
│ Helpdesk             │ ALL          │ Own+HR+Emp   │ HR+Emp   │ Own only      │
│ Inventory            │ Advanced     │ FULL         │ ❌       │ ❌            │
├──────────────────────┼──────────────┼──────────────┼──────────┼───────────────┤
│ Announcements        │ Send+View ★  │ Send+View ★  │ Send+View★│ View only    │
│ (all / specific role)│ ✅           │ ✅           │ ✅       │ ❌            │
├──────────────────────┼──────────────┼──────────────┼──────────┼───────────────┤
│ Settings             │ ALL+Edit ★   │ System+Edit ★│ Personal │ Personal only │
│                      │              │              │ +View ★  │ ★             │
├──────────────────────┼──────────────┼──────────────┼──────────┼───────────────┤
│ Tasks & Timesheet    │ Advanced     │ Assign+View  │ ❌       │ Own log       │
│ Own Profile          │ ✅           │ ✅           │ ✅       │ ✅            │
│ Clock In/Out         │ ✅           │ ✅           │ ✅       │ ✅            │
│ Apply Leave          │ ✅           │ ✅           │ ✅       │ ✅            │
├──────────────────────┼──────────────┼──────────────┼──────────┼───────────────┤
│ Approvals given to   │ ALL levels   │ HR + Emp     │ Emp only │ ❌            │
│ MFA type             │ TOTP App     │ TOTP App     │ Email OTP│ Email OTP     │
└──────────────────────┴──────────────┴──────────────┴──────────┴───────────────┘

★ = Changed in v2.1

KEY CHANGES FROM v2.0:
  ★ Role Management   → ADMIN now has Full CRUD (was SuperAdmin only)
  ★ Projects          → HR now has Full CRUD (Admin removed)
  ★ Announcements     → HR can now SEND (SA+Admin+HR all send to all/specific)
  ★ Settings Admin    → System Settings + Edit (not all)
  ★ Settings HR       → Personal + View only (no edit on other sections)
  ★ Settings Employee → Personal only

ATTENDANCE RULES:
  ≥ 8h  = Full day present
  4–8h  = Half day
  < 4h  = Counted as leave (actual hours worked still paid in salary)
  OT    = Hours beyond 8h paid at 1.5x rate

SUPERADMIN MODES:
  Primary  = View all + approvals only (no direct edits)
  Advanced = Full CRUD on everything
```

---

*Version 2.1 — Updated from v2.0 based on role clarifications.*
*This document is the single source of truth for all role decisions in NetPair IMS.*
*Build any new feature by defining role access here first, then implement.*
