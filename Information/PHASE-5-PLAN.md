# Phase 5 — Security Hardening & Code Quality

**Date:** March 2026
**Status:** 🔲 Planned — awaiting implementation command
**Depends on:** Phase 4 complete ✅

---

## Overview

Phase 5 closes all known security gaps from the MASTER_PLAN known issues list, migrates forms to React Hook Form + Yup, adds loading/error states to every remaining page, and cleans up all ESLint warnings. After this phase the app is production-ready.

---

## Part D — Security Hardening

### D1. Move JWT from localStorage → httpOnly Cookie

**Backend changes (`backend/server.js`, `backend/controllers/authController.js`)**
- On `POST /auth/login` success: set `res.cookie('token', jwt, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 })`
- Remove token from JSON response body (only send user object)
- On `POST /auth/logout`: `res.clearCookie('token')` + respond 200
- Add `POST /auth/logout` route

**Backend middleware (`backend/middleware/auth.js`)**
- `authenticate()`: read token from `req.cookies.token` instead of `Authorization` header
- Install `cookie-parser`: `npm install cookie-parser`
- Add `app.use(cookieParser())` in `server.js`

**Frontend changes (`src/context/AuthContext.jsx`)**
- Remove token from localStorage — only store `user` object (no token)
- `login()`: store only `{ id, name, email, role }` in localStorage (no token)
- `logout()`: call `POST /api/v1/auth/logout` to clear cookie, then clear localStorage

**Frontend (`src/services/api.js`)**
- Add `withCredentials: true` to axios instance so cookies are sent automatically
- Remove the `Authorization` header interceptor (token is now in cookie)

**Files to change:**
- `netpair/backend/server.js`
- `netpair/backend/controllers/authController.js`
- `netpair/backend/middleware/auth.js`
- `netpair/src/context/AuthContext.jsx`
- `netpair/src/services/api.js`

---

### D2. CSRF Protection

**Backend**
- Install `csurf`: `npm install csurf`
- Mount `csrfProtection` middleware on all state-changing routes (POST, PUT, DELETE, PATCH)
- Add `GET /api/v1/auth/csrf-token` endpoint that returns `{ csrfToken: req.csrfToken() }`
- Exempt: `POST /auth/login`, `POST /auth/register` (pre-auth, no session yet)

**Frontend (`src/services/api.js`)**
- On app init: fetch CSRF token from `GET /api/v1/auth/csrf-token`
- Add request interceptor: attach `X-CSRF-Token` header on all non-GET requests

**Files to change:**
- `netpair/backend/server.js`
- `netpair/backend/routes/auth.js`
- `netpair/src/services/api.js`

---

### D3. Input Validation with express-validator

Add `express-validator` chains to all POST/PUT routes (already installed).

**`backend/routes/auth.js`**
```javascript
// POST /register
body('email').isEmail().normalizeEmail()
body('password').isLength({ min: 6 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
body('username').trim().notEmpty().isLength({ min: 2, max: 50 })

// POST /login
body('email').isEmail().normalizeEmail()
body('password').notEmpty()
```

**`backend/routes/employees.js`**
```javascript
// POST + PUT
body('firstName').trim().notEmpty()
body('email').isEmail().normalizeEmail()
body('department').trim().notEmpty()
body('designation').trim().notEmpty()
```

**`backend/routes/leaves.js`**
```javascript
body('employeeName').trim().notEmpty()
body('type').isIn(['Annual', 'Sick', 'Casual', 'Emergency'])
body('fromDate').isISO8601()
body('toDate').isISO8601()
```

**`backend/routes/attendance.js`**
```javascript
body('employeeId').notEmpty()
body('date').isISO8601()
body('status').isIn(['Present', 'Absent', 'WFH', 'Half Day'])
```

Add a shared `validate` middleware to all routes:
```javascript
// backend/middleware/validate.js
const { validationResult } = require('express-validator');
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg, errors: errors.array() });
  next();
};
```

**Files to change/create:**
- `netpair/backend/middleware/validate.js` (new)
- `netpair/backend/routes/auth.js`
- `netpair/backend/routes/employees.js`
- `netpair/backend/routes/leaves.js`
- `netpair/backend/routes/attendance.js`

---

### D4. XSS Sanitization

- Install `xss-clean`: `npm install xss-clean`
- Add `app.use(xss())` in `server.js` before routes
- Install `express-mongo-sanitize`: `npm install express-mongo-sanitize`
- Add `app.use(mongoSanitize())` to prevent NoSQL injection

**Files to change:**
- `netpair/backend/server.js`

---

## Part E — Code Quality

### E1. ESLint Cleanup

Remove all `console.log` statements from:
- All backend controllers (replace with proper error handling)
- All frontend components

Fix React Hook dependency array warnings in:
- `src/user/Admin_Employess/Employees.jsx` — `useCallback` deps
- `src/user/Admin_Attendance/Attendance.jsx` — `useCallback` deps
- `src/user/Admin_leave_page/Leave.jsx` — `useCallback` deps
- `src/components/Dashboard/AdminDashboard.jsx` — `useCallback` deps

**Files to change:** All files with `console.log` calls

---

### E2. Loading Skeletons on All Remaining Pages

Add loading skeleton + error banner pattern to every page that will eventually fetch from API:

| Page | Skeleton Type |
|---|---|
| `WFH.jsx` | Card grid skeleton (4 cards) |
| `Payroll.jsx` | Table row skeletons |
| `Helpdesk.jsx` | Table row skeletons |
| `Policies.jsx` | Card grid skeleton |
| `Notifications.jsx` | List item skeletons |
| `RoleManagement.jsx` | Table row skeletons |
| `AuditLogs.jsx` | Table row skeletons |
| `HRManagement.jsx` | Tab content skeleton |
| `Inventory.jsx` | Table row skeletons |
| `Reports.jsx` | Chart placeholder skeleton |
| `Projects.jsx` | Table row skeletons |
| `Asset.jsx` | Table row skeletons |
| `Announcements.jsx` | Card list skeleton |
| `TaskTimesheet.jsx` | Table row skeletons |

**Skeleton pattern to use everywhere:**
```jsx
const SkeletonRow = () => (
  <tr className="animate-pulse">
    {Array.from({ length: N }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
      </td>
    ))}
  </tr>
);
```

---

### E3. Form Migration — React Hook Form + Yup

Migrate remaining forms from Formik to React Hook Form + Yup:

| Form | File | Current |
|---|---|---|
| Login | `Lform.jsx` | Already migrated ✅ |
| Register | `Rform.jsx` | Already migrated ✅ |
| Forgot Password | `Fform.jsx` | Already migrated ✅ |
| Add Employee | `Rform.jsx` (registration page) | Needs migration |
| Apply Leave modal | `Leave.jsx` | Needs migration |
| Mark Attendance modal | `AttendanceModal.jsx` | Needs migration |
| Add Task modal | `AddTaskBtnModel.jsx` | Needs migration |
| Add Project modal | `ProjectModal.jsx` | Needs migration |

**Standard pattern:**
```javascript
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({ field: yup.string().required('Field is required') });
const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(schema) });
```

**Install:** `npm install react-hook-form @hookform/resolvers yup`

---

### E4. Accessibility — htmlFor/id Audit

Ensure every `<label>` has a matching `htmlFor` and every `<input>` has a matching `id`:

Pages to audit:
- `AttendanceModal.jsx`
- `ProjectModal.jsx`
- `AddTaskBtnModel.jsx`
- `TimeSheetModel.jsx`
- `AnnouncementForm.jsx`
- All Settings form fields

---

## Implementation Order

```
Step 1:  D1  — JWT → httpOnly cookie (backend + frontend)
Step 2:  D2  — CSRF protection
Step 3:  D3  — express-validator on all routes
Step 4:  D4  — xss-clean + mongo-sanitize
Step 5:  E1  — Remove all console.log, fix hook deps
Step 6:  E2  — Loading skeletons on all remaining pages
Step 7:  E3  — Form migration to React Hook Form + Yup
Step 8:  E4  — htmlFor/id accessibility audit
```

---

## Packages to Install

```bash
# Backend
npm install cookie-parser csurf xss-clean express-mongo-sanitize

# Frontend
npm install react-hook-form @hookform/resolvers yup
```

---

## Files Summary

**Backend (modify):**
- `netpair/backend/server.js`
- `netpair/backend/controllers/authController.js`
- `netpair/backend/middleware/auth.js`
- `netpair/backend/routes/auth.js`
- `netpair/backend/routes/employees.js`
- `netpair/backend/routes/attendance.js`
- `netpair/backend/routes/leaves.js`

**Backend (new):**
- `netpair/backend/middleware/validate.js`

**Frontend (modify):**
- `netpair/src/services/api.js`
- `netpair/src/context/AuthContext.jsx`
- `netpair/src/components/Attendance/AttendanceModal.jsx`
- `netpair/src/components/Projects/ProjectModal.jsx`
- `netpair/src/components/Task_Timesheet/AddTaskBtnModel.jsx`
- All 14 pages listed in E2 (loading skeletons)

---

## Definition of Done

- [ ] `npx vite build` passes with 0 errors and 0 warnings
- [ ] JWT is in httpOnly cookie, not localStorage
- [ ] All POST/PUT/DELETE routes have validation
- [ ] No `console.log` in production code
- [ ] Every form input has `id` + matching `htmlFor`
- [ ] Every data-fetching page has loading skeleton + error banner
- [ ] `PHASE-5-DONE.md` created
