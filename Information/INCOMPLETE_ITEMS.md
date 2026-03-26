# NetPair IMS — Incomplete Items Tracker
**Last Updated:** March 2026
**Status:** Work in Progress

---

## OVERVIEW

```
Total Pages:          23
Real API Connected:    4  ✅
Mock Data Only:       16  ❌
Placeholder:           3  ⚠️

Backend Routes:        5  ✅
Missing Routes:       11  ❌
```

---

## 🔴 BACKEND — COMPLETELY MISSING (11 modules)

These have frontend pages + Mongoose models but ZERO backend routes/controllers.

| # | Module | Model Exists | Route File | Controller | Priority |
|---|--------|-------------|------------|------------|----------|
| 1 | Projects | ✅ Project.js | ❌ Missing | ❌ Missing | High |
| 2 | Tasks / Timesheet | ✅ Task.js | ❌ Missing | ❌ Missing | High |
| 3 | Payroll | ✅ Payroll.js | ❌ Missing | ❌ Missing | High |
| 4 | Announcements | ✅ Announcement.js | ❌ Missing | ❌ Missing | High |
| 5 | WFH Requests | ✅ WFHRequest.js | ❌ Missing | ❌ Missing | Medium |
| 6 | Helpdesk / Tickets | ✅ Ticket.js | ❌ Missing | ❌ Missing | Medium |
| 7 | Assets | ✅ Asset.js | ❌ Missing | ❌ Missing | Medium |
| 8 | Policies | ❌ No model | ❌ Missing | ❌ Missing | Medium |
| 9 | Inventory | ❌ No model | ❌ Missing | ❌ Missing | Low |
| 10 | Audit Logs | ❌ No model | ❌ Missing | ❌ Missing | Low |
| 11 | System Config | ❌ No model | ❌ Missing | ❌ Missing | Low |

---

## 🟡 BACKEND — INCOMPLETE (existing routes with gaps)

| # | File | Missing | Impact |
|---|------|---------|--------|
| 1 | `attendance.js` | `POST /regularization` endpoint | Employee regularization modal submits but gets 404 |
| 2 | `leaves.js` | `GET /balance` not confirmed in routes | Leave balance shows hardcoded values |
| 3 | `notifications.js` | No `DELETE` endpoint | Notifications can't be deleted |

---

## 🔴 FRONTEND — MOCK DATA (16 pages)

All these pages look real but use hardcoded arrays — changes are lost on refresh.

### 1. Projects (`Admin_Projects/Projects.jsx`)
```
❌ 5 hardcoded projects in useState
❌ Add/edit/delete only updates local state
❌ No API calls at all
Needs: GET/POST/PUT/DELETE /api/v1/projects
```

### 2. Tasks-Timesheet (`Admin_Task_Timesheet/TaskTimesheet.jsx`)
```
❌ Imports hardcoded timesheetData.jsx
❌ No API calls
❌ Add task only updates local state
Needs: GET/POST/PUT/DELETE /api/v1/tasks
```

### 3. Payroll (`Payroll/Payroll.jsx`)
```
❌ 5 hardcoded employee payroll records
❌ No API calls
❌ PDF generation uses mock data
Needs: GET/POST/PUT /api/v1/payroll
```

### 4. WFH (`WFH/WFH.jsx`)
```
❌ 5 hardcoded WFH requests
❌ Approve/reject only updates local state
Needs: GET/POST/PUT /api/v1/wfh
```

### 5. Helpdesk (`Helpdesk/Helpdesk.jsx`)
```
❌ 5 hardcoded tickets
❌ Create/update only updates local state
Needs: GET/POST/PUT /api/v1/tickets
```

### 6. Assets (`Admin_Asset_Page/Asset.jsx`)
```
❌ 6 hardcoded assets (AST-101 to AST-106)
❌ All CRUD is local state only
Needs: GET/POST/PUT/DELETE /api/v1/assets
```

### 7. Announcements (`Admin_Announcements/Announcements.jsx`)
```
❌ Empty array — no data loads
❌ Create only updates local state
Needs: GET/POST/DELETE /api/v1/announcements
```

### 8. Reports (`Admin_Reports/Reports.jsx`)
```
❌ All charts use hardcoded monthly data
❌ Attendance table is hardcoded
❌ Export generates PDF from mock data
Needs: GET /api/v1/reports/attendance, /reports/leave, /reports/summary
```

### 9. Policies (`Policies/Policies.jsx`)
```
❌ 8 hardcoded policies
❌ Add policy only updates local state
❌ Acknowledge only updates local state
Needs: GET/POST/PUT /api/v1/policies
```

### 10. Inventory (`Inventory/Inventory.jsx`)
```
❌ 10 hardcoded inventory items
❌ All CRUD is local state only
Needs: GET/POST/PUT/DELETE /api/v1/inventory
```

### 11. Audit Logs (`AuditLogs/AuditLogs.jsx`)
```
❌ 12 hardcoded log entries
❌ Export CSV uses mock data
❌ No real audit trail being recorded anywhere
Needs: GET /api/v1/audit-logs + middleware to record actions
```

### 12. Role Management (`RoleManagement/RoleManagement.jsx`)
```
❌ 8 hardcoded users with fake emails
❌ Role changes only update local state
❌ Not connected to real User collection
Needs: GET /api/v1/employees (users), PUT /api/v1/auth/role
```

### 13. HR Management (`HRManagement/HRManagement.jsx`)
```
❌ 3 hardcoded onboarding employees
❌ 5 hardcoded departments
❌ Onboarding checklist is local state only
Needs: GET/POST /api/v1/employees (onboarding filter)
```

### 14. System Config (`SystemConfig/SystemConfig.jsx`)
```
❌ Company info hardcoded
❌ Work hours hardcoded
❌ Leave policy hardcoded
❌ SMTP settings hardcoded (shows real-looking but saves nothing)
Needs: GET/PUT /api/v1/config
```

### 15. Notifications Page (`Notifications/Notifications.jsx`)
```
❌ 8 hardcoded notifications
❌ Not connected to real notification system
Note: Header bell IS connected to real API — this page is the standalone view
Needs: Use same /api/v1/notifications endpoint as header bell
```

### 16. Employee Attendance — Regularization
```
❌ Modal submits to POST /attendance/regularization
❌ Backend endpoint does not exist → 404 error
Needs: POST /api/v1/attendance/regularization handler
```

---

## ✅ FULLY WORKING (real API connected)

| Page | Backend | Status |
|------|---------|--------|
| Login / OTP / Forgot Password | `/api/v1/auth` | ✅ Full |
| Employee List | `/api/v1/employees` | ✅ Full |
| Attendance (HR view) | `/api/v1/attendance` | ✅ Full |
| Attendance (Employee view) | `/api/v1/attendance/my-*` | ✅ Full |
| Attendance Regularization | `/api/v1/attendance/regularization` | ✅ Fixed |
| Leave Management | `/api/v1/leaves` | ✅ Full |
| Notifications (Header bell) | `/api/v1/notifications` | ✅ Full |
| Notifications (Page) | `/api/v1/notifications` | ✅ Connected |
| Profile / Settings | `/api/v1/auth/profile` | ✅ Full |
| Dashboard stats | `/api/v1/attendance/dashboard-stats` | ✅ Full |
| Announcements | `/api/v1/announcements` | ✅ Connected |
| WFH Requests | `/api/v1/wfh` | ✅ Connected |
| Payroll | `/api/v1/payroll` | ✅ Connected |
| Helpdesk / Tickets | `/api/v1/tickets` | ✅ Connected |
| Assets | `/api/v1/assets` | ✅ Connected |
| Projects | `/api/v1/projects` | ✅ Connected |

---

## HARDCODED ASSET PATHS (breaks production build)

| File | Line | Issue |
|------|------|-------|
| `Sidebar/Sidebar.jsx` | ~55 | `src="src/assets/imgs/image-removebg-preview.png"` |
| `Header.jsx` | ~45 | `src="src/assets/imgs/profile_pic.jpg"` |

Fix: Use `import logo from "..."` instead of string paths.

---

## IMPLEMENTATION PRIORITY ORDER

```
Phase 7 — High Priority (core business functions)
  ├── Announcements backend + frontend connect
  ├── Attendance regularization endpoint
  ├── Leave balance dynamic calculation
  └── Notifications page connect to real API

Phase 8 — Medium Priority (HR operations)
  ├── WFH requests backend + frontend connect
  ├── Payroll backend + frontend connect
  ├── Assets backend + frontend connect
  └── Helpdesk/Tickets backend + frontend connect

Phase 9 — Medium Priority (project management)
  ├── Projects backend + frontend connect
  ├── Tasks/Timesheet backend + frontend connect
  └── Role Management connect to real users

Phase 10 — Lower Priority (admin tools)
  ├── Policies backend + frontend connect
  ├── Inventory backend + frontend connect
  ├── HR Management connect to real employees
  ├── Reports connect to real aggregated data
  ├── Audit Logs backend + middleware
  └── System Config backend + frontend connect

Production Fixes (do before any deployment)
  ├── Fix hardcoded image paths (Sidebar, Header)
  ├── Rotate secrets (JWT, MongoDB, Brevo)
  └── Set NODE_ENV=production
```

---

## QUICK STATS

```
✅ Working end-to-end:     8 features
❌ Frontend only (mock):  16 features
❌ Backend missing:       11 route modules
⚠️  Partially working:     3 features

Estimated work remaining: ~40-60 hours of backend + API integration
```
