# NetPair IMS — Incomplete Items Tracker
**Last Updated:** March 2026 — v3.0 (Post Session 2 + Real Data Integration)

---

## CURRENT STATUS

```
Total Pages:          25
Real API Connected:   25  ✅  (ALL pages connected to MongoDB)
Mock Data:             0  ✅  (ZERO dummy data remaining)

Backend Route Files:  20
Missing Routes:        0  ✅
```

---

## ✅ FULLY WORKING — ALL 25 PAGES

| Page | Backend Endpoint | Status |
|------|-----------------|--------|
| Login / OTP / Forgot | `/api/v1/auth` | ✅ |
| Dashboard (all 4 roles) | `/api/v1/attendance/dashboard-stats` | ✅ |
| Attendance (HR view) | `/api/v1/attendance/records` | ✅ |
| Attendance (Employee) | `/api/v1/attendance/my-*` + clock in/out | ✅ |
| Leave | `/api/v1/leaves` | ✅ |
| Employees | `/api/v1/employees` | ✅ |
| Announcements | `/api/v1/announcements` | ✅ |
| WFH Requests | `/api/v1/wfh` | ✅ |
| Payroll | `/api/v1/payroll` | ✅ |
| Helpdesk / Tickets | `/api/v1/tickets` | ✅ |
| Assets | `/api/v1/assets` | ✅ |
| Projects | `/api/v1/projects` | ✅ |
| Tasks / Timesheet | `/api/v1/tasks` | ✅ |
| Policies | `/api/v1/policies` | ✅ |
| Inventory | `/api/v1/inventory` | ✅ |
| Audit Logs | `/api/v1/audit-logs` | ✅ |
| Role Management | `/api/v1/auth/users` + role change | ✅ |
| HR Management | `/api/v1/employees` (real data) | ✅ |
| System Config | `/api/v1/system-config` | ✅ |
| Reports | `/api/v1/reports/*` (4 endpoints) | ✅ |
| Notifications (page) | `/api/v1/notifications` | ✅ |
| Notifications (header bell) | `/api/v1/notifications` | ✅ |
| Profile / Settings | `/api/v1/auth/profile` | ✅ |

---

## � BUGS FIXED THIS SESSION

| Bug | Files Fixed | Status |
|-----|-------------|--------|
| `tickets.filter is not a function` — API returns `{ records, pagination }` object but code fell back to the whole object instead of the array | `Helpdesk.jsx`, `Announcements.jsx`, `WFH.jsx`, `Policies.jsx`, `Payroll.jsx`, `Inventory.jsx`, `HRManagement.jsx`, `AuditLogs.jsx`, `TaskTimesheet.jsx`, `Asset.jsx` | ✅ Fixed |

---

## �🔴 STILL INCOMPLETE — MINOR GAPS

### 1. Notification DELETE endpoint missing

The Notifications page has a delete button that calls `DELETE /api/v1/notifications/:id`
but the route does not exist in `backend/routes/notifications.js`.

```
File:   backend/routes/notifications.js
Fix:    Add router.delete("/:id", deleteNotification)
        Add deleteNotification handler in notificationController.js
```

---

### 2. Hardcoded image paths — breaks production build

```
File:   src/components/Sidebar/Sidebar.jsx  (~line 55)
Issue:  src="src/assets/imgs/image-removebg-preview.png"
Fix:    import logo from "../../assets/imgs/image-removebg-preview.png"
        then use src={logo}

File:   src/components/Header.jsx  (~line 45)
Issue:  src="src/assets/imgs/profile_pic.jpg"
Fix:    import profilePic from "../assets/imgs/profile_pic.jpg"
        then use src={profilePic}
```

---

### 3. Audit logging middleware not wired

The `AuditLog` model and controller exist and the page reads real data.
But no actions are actually being logged yet — the page will be empty
until the `auditLogController.log()` utility is called from other controllers.

```
Needs: Call auditLogController.log() inside:
  - authController.js     → on login, logout, role change
  - employeeController.js → on create, update, delete
  - leaveController.js    → on approve, reject
  - payrollController.js  → on mark paid
  - attendanceController.js → on mark attendance
```

---

### 4. Tasks page — Add Task modal uses hardcoded employee dropdown

```
File:   src/components/Task_Timesheet/AddTaskBtnModel.jsx
Issue:  Employee dropdown has 3 hardcoded names (Rohit, Amit, Neha)
Fix:    Fetch real employees from /api/v1/employees and populate dropdown
```

---

### 5. Leave balance endpoint not connected to frontend

```
File:   backend/routes/leaves.js
Route:  GET /api/v1/leaves/balance/:employeeId  ← exists
Issue:  EmployeeAttendance.jsx calls /leaves/balance (no :employeeId param)
        Leave page shows hardcoded balance values
Fix:    Update frontend to call /leaves/balance/:empId with real employee ID
```

---

### 6. Reports — Department filter uses hardcoded list

```
File:   src/user/Admin_Reports/Reports.jsx
Issue:  Department dropdown has hardcoded options
Fix:    Fetch departments from /api/v1/employees?distinct=department
```

---

## 🟡 PRODUCTION HARDENING — NOT DONE YET

### Security

| # | Issue | File | Priority |
|---|-------|------|----------|
| 1 | Rotate JWT_SECRET, MONGODB_URI, BREVO_API_KEY | `backend/.env` | 🔴 Critical |
| 2 | Cookie `secure: true` + `sameSite: "none"` for HTTPS | `authController.js` | 🔴 Critical |
| 3 | `express-mongo-sanitize` not applied | `server.js` | 🟡 High |
| 4 | No global rate limiter (only auth routes limited) | `server.js` | 🟡 High |
| 5 | `NODE_ENV=production` not set | `backend/.env` | 🔴 Critical |
| 6 | `FRONTEND_URL` still localhost | `backend/.env` | 🔴 Critical |

### Code Quality

| # | Issue | File |
|---|-------|------|
| 7 | `console.log` debug statements | `authController.js` |
| 8 | `console.log` debug statements | `Registration.jsx` |

---

## 🟢 NICE TO HAVE — FUTURE PHASES

| Feature | Description |
|---------|-------------|
| Real-time attendance | Socket.IO push when employee clocks in — HR sees live |
| PDF payslip | `generatePayslipPDF` exists but uses old field names — needs update |
| Email on leave approve | Notify employee via Brevo when leave is approved/rejected |
| Email on ticket update | Notify employee when helpdesk ticket status changes |
| Pagination UI | All list pages load 100-200 records — add next/prev buttons |
| Search in Reports | Reports table has no search — add employee name search |
| Profile photo upload | Settings page has initials avatar — no photo upload yet |
| WFH calendar view | WFH page is table only — add monthly calendar view |
| Task comments | Tasks have no comment/note thread |
| Bulk payroll generate | Generate payroll for all employees in one click |

---

## SUMMARY

```
Pages with real data:     25 / 25  ✅
Backend route modules:    20 / 20  ✅
Critical bugs remaining:   2  (hardcoded image paths)
Minor gaps:                4  (notification delete, audit wiring, task dropdown, leave balance)
Production blockers:       6  (secrets, NODE_ENV, cookie flags, sanitize, rate limit)
```

---

## 📋 FUTURE UPDATES BY ROLE

See full breakdown in: **`Information/FUTURE_UPDATES_BY_ROLE.md`**

### Quick Summary

| Role | Planned Updates | High Priority |
|------|----------------|---------------|
| SuperAdmin | 10 | Audit trail wiring, user deactivate, approval queue |
| Admin | 12 | Reports fixes, inventory alerts, permission overrides |
| HR | 15 | Bulk payroll, leave balance fix, onboarding save, WFH calendar |
| Employee | 13 | Task dropdown fix, leave balance, profile photo, notification delete |
| All Roles | 12 | Pagination UI, dark mode, real-time push, error boundaries |
| Production | 8 | Secrets rotation, NODE_ENV, cookie flags, rate limiting |
| Sidebar | 26 | Logo fix, labels rename, badges, dark mode, new nav items |
| **Total** | **96** | |
