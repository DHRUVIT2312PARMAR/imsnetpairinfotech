# Phase 6 — v1.1 Features (Production Enhancements)

**Date:** March 2026
**Status:** 🔲 Planned — awaiting implementation command
**Depends on:** Phase 5 complete

---

## Overview

Phase 6 delivers the v1.1 feature roadmap from MASTER_PLAN.md. These are production enhancements that add real-time capabilities, document generation, UI polish, and developer experience improvements. Each part is independent and can be implemented separately.

---

## Part F1 — Real-Time Notifications (WebSocket)

### Goal
Live notification badge in the Header that updates without page refresh. Employees see leave approvals, attendance alerts, and announcements in real time.

### Backend
- Install `socket.io`: `npm install socket.io`
- Attach Socket.IO to the Express HTTP server in `server.js`
- Create `backend/socket/notificationHandler.js`:
  - On client connect: join room by `userId`
  - Emit `notification:new` when leave is approved/rejected
  - Emit `notification:new` when attendance is marked
  - Emit `notification:announcement` when new announcement is posted
- Add socket emit calls inside relevant controllers:
  - `leaveController.approveLeave` → emit to employee's room
  - `leaveController.rejectLeave` → emit to employee's room
  - `attendanceController.markAttendance` → emit to employee's room

### Frontend
- Install `socket.io-client`: `npm install socket.io-client`
- Create `src/hooks/useSocket.jsx`:
  ```javascript
  // Connects to backend socket, joins user room, listens for events
  // Returns: { notifications, unreadCount, markRead, markAllRead }
  ```
- Update `src/components/Header.jsx`:
  - Add notification bell icon with unread count badge
  - Badge: `absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center`
  - Click bell → dropdown list of recent notifications
- Update `src/user/Notifications/Notifications.jsx`:
  - Replace mock data with live socket notifications
  - Persist notifications to `GET /api/v1/notifications` (new endpoint)

### New Backend Files
- `netpair/backend/socket/notificationHandler.js`
- `netpair/backend/models/Notification.js`
- `netpair/backend/controllers/notificationController.js`
- `netpair/backend/routes/notifications.js`

### Files to Modify
- `netpair/backend/server.js`
- `netpair/backend/controllers/leaveController.js`
- `netpair/backend/controllers/attendanceController.js`
- `netpair/src/components/Header.jsx`
- `netpair/src/user/Notifications/Notifications.jsx`

---

## Part F2 — PDF Generation

### Goal
Employees can download their payslip as a PDF. Admins can export attendance reports as PDF.

### Install
```bash
npm install jspdf jspdf-autotable
```

### Payslip PDF (`src/user/Payroll/Payroll.jsx`)
- "Download PDF" button on each payslip row
- `generatePayslipPDF(employee)` utility in `src/services/pdfService.js`:
  ```javascript
  // Creates A4 PDF with:
  // - Company logo + name header
  // - Employee details (name, ID, department, designation)
  // - Salary breakdown table (Basic, Allowances, Deductions, Net Pay)
  // - Month/Year + generated date footer
  // - Auto-download as "payslip_[name]_[month].pdf"
  ```

### Attendance Report PDF (`src/user/Admin_Reports/Reports.jsx`)
- "Export PDF" button alongside existing "Export CSV"
- `generateAttendanceReportPDF(data, dateRange)` in `src/services/pdfService.js`:
  ```javascript
  // Creates PDF with:
  // - Report title + date range header
  // - Summary stats (Present/Absent/Late/WFH counts)
  // - Full attendance table
  // - Auto-download as "attendance_report_[from]_[to].pdf"
  ```

### New Files
- `netpair/src/services/pdfService.js`

### Files to Modify
- `netpair/src/user/Payroll/Payroll.jsx`
- `netpair/src/user/Admin_Reports/Reports.jsx`

---

## Part F3 — Dark Mode

### Goal
Toggle between light and dark theme. Preference saved to localStorage.

### Implementation
- Add `darkMode: 'class'` to Tailwind config (already supported in Tailwind v4 via `@variant dark`)
- Create `src/context/ThemeContext.jsx`:
  ```javascript
  // Manages: isDark, toggleTheme()
  // On mount: read from localStorage('theme')
  // toggleTheme(): toggle 'dark' class on <html>, save to localStorage
  ```
- Wrap app in `<ThemeProvider>` in `main.jsx`
- Update `src/user/Settings/Settings.jsx`:
  - Add "Appearance" section with Light/Dark/System toggle buttons
  - Calls `toggleTheme()` from ThemeContext
- Update `src/components/Header.jsx`:
  - Add sun/moon icon button that calls `toggleTheme()`

### Dark mode class additions (key components only)
```
bg-white          → bg-white dark:bg-gray-800
bg-gray-50        → bg-gray-50 dark:bg-gray-900
text-gray-800     → text-gray-800 dark:text-gray-100
border-gray-200   → border-gray-200 dark:border-gray-700
bg-gradient-to-br from-slate-50 to-gray-100 → dark:from-gray-900 dark:to-gray-800
```

### New Files
- `netpair/src/context/ThemeContext.jsx`

### Files to Modify
- `netpair/src/main.jsx`
- `netpair/src/components/Header.jsx`
- `netpair/src/user/Settings/Settings.jsx`
- `netpair/index.html` (add `class=""` to `<html>`)
- All page wrapper components (add dark: variants)

---

## Part F4 — Multi-Language (i18n)

### Goal
Support English and Hindi. Language preference saved to localStorage.

### Install
```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

### Setup
- Create `src/i18n/index.js` — i18next config with language detector
- Create `src/i18n/locales/en.json` — English strings
- Create `src/i18n/locales/hi.json` — Hindi strings
- Wrap app in `<I18nextProvider>` in `main.jsx`

### Translation keys (priority pages)
```json
// en.json
{
  "nav": { "dashboard": "Dashboard", "employees": "Employees", ... },
  "dashboard": { "title": "Dashboard", "totalEmployees": "Total Employees", ... },
  "leave": { "apply": "Apply Leave", "approve": "Approve", "reject": "Reject", ... },
  "attendance": { "markAttendance": "Mark Attendance", "present": "Present", ... },
  "common": { "save": "Save", "cancel": "Cancel", "delete": "Delete", "search": "Search", ... }
}
```

### Language Switcher
- Add language toggle (EN | HI) to `src/components/Header.jsx`
- Add language preference to `src/user/Settings/Settings.jsx`

### New Files
- `netpair/src/i18n/index.js`
- `netpair/src/i18n/locales/en.json`
- `netpair/src/i18n/locales/hi.json`

### Files to Modify
- `netpair/src/main.jsx`
- `netpair/src/components/Header.jsx`
- `netpair/src/user/Settings/Settings.jsx`
- Priority: Dashboard, Leave, Attendance, Employees pages

---

## Part F5 — Email Notifications

### Goal
Send email on leave approval/rejection and attendance alerts.

### Install (Backend)
```bash
npm install nodemailer
```

### Setup
- Create `backend/services/emailService.js`:
  ```javascript
  // sendLeaveApprovalEmail(employee, leave)
  // sendLeaveRejectionEmail(employee, leave, reason)
  // sendAttendanceAlertEmail(employee, date)
  // Uses nodemailer with SMTP config from .env
  ```
- Add to `backend/.env`:
  ```
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your@email.com
  SMTP_PASS=your-app-password
  FROM_EMAIL=noreply@netpair.com
  ```
- Call `emailService` inside `leaveController.approveLeave` and `leaveController.rejectLeave`

### New Files
- `netpair/backend/services/emailService.js`

### Files to Modify
- `netpair/backend/controllers/leaveController.js`
- `netpair/backend/controllers/attendanceController.js`
- `netpair/backend/.env`

---

## Part F6 — CI/CD Pipeline (GitHub Actions)

### Goal
Auto-run lint + build on every PR. Block merge if build fails.

### Files to Create
- `.github/workflows/ci.yml`:
  ```yaml
  name: CI
  on: [push, pull_request]
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: '20' }
        - run: npm ci
          working-directory: netpair
        - run: npm run build
          working-directory: netpair
        - run: npm ci
          working-directory: netpair/backend
        - run: node --check server.js
          working-directory: netpair/backend
  ```

---

## Implementation Order

```
Step 1:  F1  — Real-time notifications (socket.io) — HIGH IMPACT
Step 2:  F2  — PDF generation (payslips + reports) — HIGH VALUE
Step 3:  F3  — Dark mode — MEDIUM EFFORT
Step 4:  F5  — Email notifications — MEDIUM EFFORT
Step 5:  F4  — Multi-language (i18n) — MEDIUM EFFORT
Step 6:  F6  — CI/CD pipeline — LOW EFFORT
```

---

## Packages Summary

```bash
# Backend
npm install socket.io nodemailer

# Frontend
npm install socket.io-client jspdf jspdf-autotable react-i18next i18next i18next-browser-languagedetector
```

---

## Definition of Done

- [ ] Notification badge in Header updates in real time without refresh
- [ ] Payslip PDF downloads correctly with all salary fields
- [ ] Attendance report PDF exports with table + summary
- [ ] Dark mode toggle works and persists across page refresh
- [ ] EN/HI language toggle works on Dashboard, Leave, Attendance, Employees
- [ ] Email sent on leave approve/reject (verifiable in email inbox)
- [ ] GitHub Actions CI passes on push
- [ ] `PHASE-6-DONE.md` created
