# NetPair IMS — Master Plan & Implementation Guide
**Version:** 2.0.0 | **Stack:** React 19 + Vite + Tailwind CSS + Express + MongoDB | **Updated:** March 2026

---

## ⚠️ CRITICAL RULES — READ BEFORE ANY WORK

- NEVER change existing styles, Tailwind classes, `App.css`, or `style.css`
- NEVER change the sidebar, header, routing structure, or color palette
- NEVER change existing component file names or folder structure
- Always preserve existing gradient backgrounds, card styles, button styles, and rounded panel patterns
- Only ADD new features/components inside existing page wrappers
- Always read this file fully before starting any feature work
- Follow the Global UI Patterns table for every new element added

---

## 1. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React | 19.2.0 |
| Build Tool | Vite | 7.2.4 |
| Routing | React Router DOM | 7.12.0 |
| Styling | Tailwind CSS | 4.1.18 (`@import "tailwindcss"`) |
| Charts | Recharts | 3.7.0 |
| Forms | Formik + Yup (current) → React Hook Form + Yup (planned) | — |
| Icons | Remixicon (`ri-*`) + React Icons | — |
| Notifications | React Toastify | 10.0.4 |
| HTTP Client | Axios | — |
| Backend | Express | 5.2.1 |
| Database | MongoDB + Mongoose | 9.2.1 |
| Auth | JWT + bcryptjs | — |


---

## 2. File Structure (Target)

```
netpair/
├── backend/
│   ├── config/
│   ├── controllers/         # authController, employeeController, attendanceController, leaveController
│   ├── middleware/          # auth.js → authenticate(), restrictTo(), requirePermission()
│   ├── models/              # User, Employee, Attendance, Leave
│   ├── routes/              # auth, employees, attendance, leaves
│   └── server.js
│
└── src/
    ├── assets/imgs/
    ├── components/
    │   ├── Announcements/
    │   ├── Asset/
    │   ├── Attendance/
    │   ├── Charts/
    │   ├── Dashboard/
    │   ├── Employee/
    │   ├── Forgot/
    │   ├── Leave/
    │   ├── Login/
    │   ├── Projects/
    │   ├── Registration/
    │   ├── Sidebar/          # Sidebar.jsx + Sidedata.jsx
    │   ├── Task_Timesheet/
    │   └── Header.jsx
    ├── context/
    │   └── AuthContext.jsx   # JWT management, role + permission state
    ├── hooks/
    │   └── useApi.jsx        # API polling hook with cleanup
    ├── schemas/
    │   └── index.jsx         # Yup validation schemas
    ├── services/
    │   ├── api.js            # Axios instance + interceptors
    │   └── authService.js
    └── user/
        ├── Admin_Announcements/
        ├── Admin_Asset_Page/
        ├── Admin_Attendance/
        ├── Admin_Employess/
        ├── Admin_leave_page/
        ├── Admin_Projects/
        ├── Admin_Reports/
        ├── Admin_Task_Timesheet/
        ├── Dash/
        ├── Home/
        ├── Settings/
        └── AuthLayout.jsx
```

---

## 3. Design System

### 3.1 Color Palette

| Token | Value | Usage |
|---|---|---|
| Primary | `#1a3fb5` | Buttons, highlights, active states |
| Primary Hover | `#1535a0` | Button hover |
| Success | `#10b981` | Present, active, success |
| Warning | `#f59e0b` | Pending, warnings |
| Danger | `#ef4444` | Absent, errors, delete |
| Info | `#3b82f6` | Informational |
| Page BG | `bg-gray-50` / `#f9fafb` | Page background |
| Card BG | `white` | Cards, panels |
| Border | `border-gray-200` / `#e5e7eb` | Card borders |
| Text Primary | `text-gray-900` | Headings |
| Text Body | `text-gray-700` | Body text |
| Text Muted | `text-gray-500` | Secondary |

### 3.2 Typography

```
28px / 700  → Stat numbers (inline style)
20px / 700  → Page titles: text-xl font-bold
16px / 600  → Section headers: text-base font-semibold
14px        → Body: text-sm
12px        → Metadata: text-xs
8px         → Date badges only: text-[8px]
Font family → 'DM Sans', sans-serif (planned global)
```

### 3.3 Global UI Patterns (ALWAYS FOLLOW)

| Element | Class Pattern |
|---|---|
| Page wrapper | `relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl` |
| Page title | `text-2xl font-semibold` |
| Primary button | `bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition` |
| Danger button | `bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition` |
| Ghost button | `border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition` |
| White card | `bg-white rounded-2xl shadow-sm border border-gray-200 p-6` |
| Table wrapper | `bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto` |
| Modal overlay | `fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4` |
| Modal card | `bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl` |
| Status badge | `px-3 py-1 rounded-full text-xs font-semibold` |
| Input field | `border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500` |
| Error text | `mt-1 text-xs text-red-600 flex items-center gap-1` |


---

## 4. Authentication UI

### Current State
- `AuthLayout.jsx` — split panel (form left, image right) ✅
- `Lform.jsx` — login with email, password, role select, Formik validation ✅
- `Rform.jsx` — employee registration form ✅
- `Fform.jsx` — forgot password form ✅

### Auth Layout Pattern (preserve this)
```
┌──────────────────────┬──────────────────────────────┐
│  LEFT — Form (50%)   │  RIGHT — Image/Illustration  │
│  Logo                │  (currently img1.jpg)         │
│  Heading             │                               │
│  Inputs              │                               │
│  Submit Button       │                               │
│  Nav link            │                               │
└──────────────────────┴──────────────────────────────┘
```

### Planned Auth Features
- [ ] **Login:** Show/hide password toggle, loading state on submit button ("Signing In...")
- [ ] **Login:** Replace role select with JWT-based role detection from backend
- [ ] **Login:** Connect to `POST /api/v1/auth/login`, store JWT in localStorage
- [ ] **Registration:** Connect to `POST /api/v1/auth/register`
- [ ] **Forgot Password:** Email → OTP → Reset flow (3-step UI)
- [ ] **Route Protection:** `ProtectedRoute` (redirect to `/` if not authenticated), `PublicRoute` (redirect to `/dashboard` if authenticated)
- [ ] **AuthContext:** JWT management, role + permission state (see Section 8)

### Route Protection (to implement)
```jsx
// ProtectedRoute — redirects to "/" if not authenticated
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

// PublicRoute — redirects to "/dashboard" if already authenticated
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};
```

---

## 5. Layout Architecture

### App Shell (`Home.jsx`) — Target Pattern
```jsx
<div className="flex min-h-screen">
  <Sidebar className="min-h-screen flex-shrink-0" />
  <div className="flex-1 flex flex-col min-h-screen">
    <Header className="flex-shrink-0" />
    <main className="flex-1 bg-gray-50">
      <Outlet />
    </main>
  </div>
</div>
```

**Layout rules:**
- Use `min-h-screen` NOT `h-screen` on layout containers
- Use `flex-shrink-0` on fixed-height elements (header, sidebar)
- Never add `overflow-hidden` to parent containers

### Header Planned Updates
- Show `user.username` from AuthContext instead of hardcoded "Elonmusk"
- Add role badge: `text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full`
- Add functional Logout button (clear localStorage, redirect to `/`)
- Responsive: truncate name on small screens, icon-only logout on mobile

---

## 6. RBAC — Role-Based Access Control

### Four-Tier Role System

| Role | Nav Items | Access Level |
|---|---|---|
| `superAdmin` | 21 (all) | Full system |
| `admin` | 18 | All except system config, role mgmt, audit logs |
| `hr` | 15 | HR operations only |
| `employee` | 8 | Personal data only |

### Permission Matrix
```javascript
const rolePermissions = {
  superAdmin: ['*'],
  admin: [
    'employees:read', 'employees:write', 'employees:delete',
    'attendance:read', 'attendance:write', 'attendance:manage',
    'leaves:read', 'leaves:write', 'leaves:approve',
    'reports:read', 'reports:generate',
    'projects:read', 'projects:write',
    'tasks:read', 'tasks:write',
    'settings:read', 'settings:write'
  ],
  hr: [
    'employees:read', 'employees:write', 'employees:delete',
    'attendance:read', 'attendance:write', 'attendance:manage',
    'leaves:read', 'leaves:write', 'leaves:approve',
    'payroll:read', 'payroll:write',
    'reports:read', 'reports:generate',
    'settings:read', 'settings:write'
  ],
  employee: [
    'profile:read', 'profile:write',
    'attendance:read', 'attendance:write',
    'leaves:read', 'leaves:write',
    'tasks:read', 'tasks:write'
  ]
};
```

### First-User Admin Logic
```
1st user registered → role: 'admin'   (auto)
All subsequent      → role: 'employee' (default)
superAdmin          → set manually in DB
```

### Sidebar Role Filtering (to implement)
```javascript
// Filter nav items based on user.role from AuthContext
const navItems = allNavItems.filter(item => {
  if (!item.roles) return true;
  return item.roles.includes(user?.role);
});
```


---

## 7. All 20 Modules — Feature Plan

### Module Index

| # | Module | Route | Roles | Status |
|---|---|---|---|---|
| 1 | Dashboard | `/dashboard` | All | ✅ Exists |
| 2 | Employees | `/employees` | Admin, HR | ✅ Exists |
| 3 | HR Management | `/hr-management` | HR, Admin, superAdmin | ❌ New |
| 4 | Attendance | `/attendance` | All | ✅ Exists |
| 5 | Leave Management | `/leave` | All | ✅ Exists |
| 6 | WFH Records | `/wfh` | All | ❌ New |
| 7 | Payroll | `/payroll` | HR, Admin, superAdmin | ❌ New |
| 8 | Projects | `/projects` | Admin, superAdmin | ✅ Exists |
| 9 | Tasks & Timesheet | `/tasktimesheet` | All | ✅ Exists |
| 10 | Assets | `/assets` | Admin, HR, superAdmin | ✅ Exists |
| 11 | Inventory | `/inventory` | Admin, superAdmin | ❌ New |
| 12 | Helpdesk | `/helpdesk` | All | ❌ New |
| 13 | Announcements | `/announcements` | All | ✅ Exists |
| 14 | Policies | `/policies` | All | ❌ New |
| 15 | Reports | `/reports` | HR, Admin, superAdmin | ✅ Exists |
| 16 | Notifications | `/notifications` | All | ❌ New |
| 17 | Settings | `/settings` | All | ✅ Exists |
| 18 | Role Management | `/role-management` | Admin, superAdmin | ❌ New |
| 19 | Audit Logs | `/audit-logs` | Admin, superAdmin | ❌ New |
| 20 | System Config | `/system-configuration` | superAdmin only | ❌ New |

---

### Module 1 — Dashboard (`/dashboard`)
**Current:** Stats cards, BarChart, PieChart, AreaChart, Table.

**Planned:**
- [ ] Role-based dashboard views (SuperAdmin / Admin / HR / Employee dashboards)
- [ ] Stat cards: Total Employees, Present Today, On Leave, WFH Today (dynamic from API)
- [ ] Recent Activity feed (clock-ins, leave requests, new employees)
- [ ] Upcoming Events section
- [ ] Quick Actions shortcuts (Add Employee, Mark Attendance, Add Task)
- [ ] Charts with custom tooltips (see Section 9 for chart specs)

**Stats target:** Total: 94 | Present: 78 | On Leave: 12 | WFH: 8

---

### Module 2 — Employees (`/employees`)
**Current:** Employee cards grid, Add Employee button.

**Planned:**
- [ ] Search by name/email/designation
- [ ] Filter by department, status (Active/Inactive/Terminated)
- [ ] Pagination (page + limit params)
- [ ] Employee detail modal (click card → full profile)
- [ ] Edit employee from modal
- [ ] Delete with confirmation (soft delete → status: 'terminated')
- [ ] Status badge (Active / Inactive / Terminated)
- [ ] Export CSV
- [ ] Stats: Total 248 | Active 230 | New Hires 12 | Resigned 6

**API Endpoints:**
```
GET    /api/v1/employees                  List + search/filter/paginate
GET    /api/v1/employees/:id              Single employee
POST   /api/v1/employees                  Create (HR/Admin)
PUT    /api/v1/employees/:id              Update (HR/Admin)
DELETE /api/v1/employees/:id              Soft delete
PATCH  /api/v1/employees/:id/status       Status update
GET    /api/v1/employees/stats            Statistics
```

---

### Module 3 — HR Management (`/hr-management`) ❌ New
**Planned:**
- [ ] Employee onboarding checklist
- [ ] Offboarding workflow
- [ ] HR documents management
- [ ] Performance review tracking
- [ ] Department management

---

### Module 4 — Attendance (`/attendance`)
**Current:** Cards, filter, mark attendance modal.

**Planned:**
- [ ] Calendar view toggle (list ↔ calendar)
- [ ] Bulk mark attendance
- [ ] Late arrival highlight (check-in after 09:00)
- [ ] WFH vs Office breakdown chart
- [ ] Monthly summary per employee
- [ ] Export CSV/PDF
- [ ] Clock-in/out for employees (self-service)

**Auto-calculated fields (backend):**
```
workingHours  = checkOut - checkIn
isLate        = checkIn after 09:00 AM
status:  ≥8h → present | 4-7.99h → half-day | WFH → wfh | <4h → absent
```

**API Endpoints:**
```
POST   /api/v1/attendance/clock-in
POST   /api/v1/attendance/clock-out
GET    /api/v1/attendance/today
GET    /api/v1/attendance/records
POST   /api/v1/attendance/mark          (Admin/HR)
GET    /api/v1/attendance/weekly-data   (chart data)
```

---

### Module 5 — Leave Management (`/leave`)
**Current:** Cards, filter, table with approve/reject.

**Planned:**
- [ ] Apply Leave modal (employee self-service)
- [ ] Leave balance tracker per employee (Annual/Sick/Casual)
- [ ] Multi-level approval: Employee → Manager → HR
- [ ] Leave calendar view
- [ ] Export report
- [ ] Leave history per employee

**Leave types:** Annual | Sick | Casual

**API Endpoints:**
```
GET    /api/v1/leaves
POST   /api/v1/leaves                   Submit request
PUT    /api/v1/leaves/:id/approve       (Manager/HR)
PUT    /api/v1/leaves/:id/reject        (Manager/HR)
GET    /api/v1/leaves/balance/:userId
GET    /api/v1/leaves/calendar
```

---

### Module 6 — WFH Records (`/wfh`) ❌ New
**Planned:**
- [ ] WFH request form (date, reason)
- [ ] Manager approval workflow
- [ ] WFH calendar view
- [ ] Monthly WFH count per employee
- [ ] Stats: WFH Today, This Month, Pending Requests

---

### Module 7 — Payroll (`/payroll`) ❌ New
**Planned:**
- [ ] Payroll summary cards (Total Payroll, Paid, Pending, Deductions)
- [ ] Employee payslip table
- [ ] Generate payslip modal
- [ ] Export payslip as PDF
- [ ] Salary breakdown (Basic + Allowances - Deductions)
- [ ] Access: HR, Admin, superAdmin only

---

### Module 8 — Projects (`/projects`)
**Current:** Cards, filter, table, add/edit modal.

**Planned:**
- [ ] Assign employees to projects
- [ ] Project progress bar (% complete based on tasks)
- [ ] Kanban board view toggle
- [ ] Project tags (High Priority, Client Project)
- [ ] Due date warning (red if overdue)
- [ ] Project detail view (tasks, team, timeline)
- [ ] Project search

---

### Module 9 — Tasks & Timesheet (`/tasktimesheet`)
**Current:** Cards, filters, table, add task modal.

**Planned:**
- [ ] Task priority levels (Low/Medium/High) with color coding
- [ ] Assign task to employee (dropdown)
- [ ] Time logging per task (start/stop timer)
- [ ] Weekly timesheet summary view
- [ ] Filter by assignee, project, status, priority
- [ ] Export CSV
- [ ] Priority colors: green=Low, yellow=Medium, red=High

---

### Module 10 — Assets (`/assets`)
**Current:** Cards, table, add/edit modal.

**Planned:**
- [ ] Return asset action (Assigned → Available)
- [ ] Damaged asset reporting with notes
- [ ] Asset history log (who had it, when)
- [ ] Search and filter by category/status
- [ ] Export asset list
- [ ] Status: green=Assigned, blue=Available, red=Damaged

---

### Module 11 — Inventory (`/inventory`) ❌ New
**Planned:**
- [ ] Stock items list (name, quantity, category, location)
- [ ] Add/edit/delete stock items
- [ ] Low stock alerts
- [ ] Stock movement log (in/out)
- [ ] Access: Admin, superAdmin only

---

### Module 12 — Helpdesk (`/helpdesk`) ❌ New
**Planned:**
- [ ] Raise ticket form (subject, category, priority, description)
- [ ] Ticket list with status (Open/In Progress/Resolved/Closed)
- [ ] Assign ticket to team member
- [ ] Ticket detail view with comments
- [ ] Stats: Open, In Progress, Resolved, Avg Resolution Time

---

### Module 13 — Announcements (`/announcements`)
**Current:** Form, list, detail modal.

**Planned:**
- [ ] Categories (General, HR, IT, Event) with color badges
- [ ] Pin important announcements to top
- [ ] Target audience (All / Department / Individual)
- [ ] Read/unread tracking
- [ ] Search announcements

---

### Module 14 — Policies (`/policies`) ❌ New
**Planned:**
- [ ] Policy document list (title, category, last updated)
- [ ] Upload/link policy PDF
- [ ] Policy categories (HR, IT, Finance, General)
- [ ] Employee acknowledgement tracking
- [ ] Search and filter

---

### Module 15 — Reports (`/reports`)
**Current:** Summary cards, filter, attendance table.

**Planned:**
- [ ] Attendance trend line chart (monthly)
- [ ] Leave summary pie chart (by type)
- [ ] Department-wise breakdown charts
- [ ] Date range picker (from–to)
- [ ] Export to PDF/CSV (functional)
- [ ] Employee performance report section
- [ ] Asset utilization report

---

### Module 16 — Notifications (`/notifications`) ❌ New
**Planned:**
- [ ] Notification list (all system alerts)
- [ ] Mark as read / mark all as read
- [ ] Filter by type (Leave, Attendance, System, Announcement)
- [ ] Notification badge count in header
- [ ] Real-time via WebSocket (v1.1 roadmap)

---

### Module 17 — Settings (`/settings`)
**Current:** Profile form, security section.

**Planned:**
- [ ] Change Password modal (current + new + confirm)
- [ ] Profile picture upload
- [ ] Company/organization settings
- [ ] Notification preferences toggles
- [ ] Theme toggle (Light/Dark — v1.1 roadmap)

---

### Module 18 — Role Management (`/role-management`) ❌ New
**Planned:**
- [ ] User list with current roles
- [ ] Change role dropdown (employee/hr/admin/superAdmin)
- [ ] Permission matrix view
- [ ] Access: Admin, superAdmin only

---

### Module 19 — Audit Logs (`/audit-logs`) ❌ New
**Planned:**
- [ ] Activity log table (who, what action, when, IP)
- [ ] Filter by user, action type, date range
- [ ] Export logs
- [ ] Access: Admin, superAdmin only

---

### Module 20 — System Config (`/system-configuration`) ❌ New
**Planned:**
- [ ] Company profile settings
- [ ] Working hours configuration
- [ ] Leave policy configuration
- [ ] Email/SMTP settings
- [ ] Access: superAdmin only


---

## 8. AuthContext & API Layer (to implement)

### AuthContext (`src/context/AuthContext.jsx`)
```javascript
// Manages: user, isAuthenticated, loading, login(), logout(), hasPermission()
// On mount: validate stored JWT from localStorage
// login(): POST /auth/login → store token + user → setUser + setIsAuthenticated
// logout(): clear localStorage → setUser(null) + setIsAuthenticated(false)
// hasPermission(permission): check rolePermissions[user.role].includes(permission)
```

### API Client (`src/services/api.js`)
```javascript
// Axios instance with baseURL: import.meta.env.VITE_API_BASE_URL
// Request interceptor: attach Bearer token from localStorage
// Response interceptor: on 401 → clear localStorage + redirect to "/"
```

### Custom Hook (`src/hooks/useApi.jsx`)
```javascript
// useApi(fetchFn, dependencies, interval)
// Returns: { data, loading, error, refetch }
// Supports polling with interval + cleanup (clearInterval on unmount)
```

### Environment Variables
```env
# Frontend (.env)
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=HR Management System
VITE_COMPANY_NAME=NetPair InfoTech

# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/hr_management
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### Standard API Response Format
```json
{ "success": true, "message": "Operation successful", "data": {}, "error": null }
```

---

## 9. Charts & Data Visualization

All charts use **Recharts** via `ResponsiveContainer` (width="100%", height=220).

### Chart Color Palette
```javascript
const CHART_COLORS = {
  present: "#3b5bdb", absent: "#fa5252", wfh: "#20c997",
  late: "#ffa94d", sickLeave: "#fa5252", casual: "#ffa94d",
  annual: "#3b5bdb", engineering: "#3b5bdb", sales: "#e67700",
  operations: "#868e96", finance: "#2f9e44", hr: "#2f9e44", marketing: "#ae3ec9"
};
```

### Common Chart Config
```jsx
<CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
<XAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
<YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
<Legend wrapperStyle={{ fontSize: 11 }} />
```

### Charts to implement/upgrade
- [ ] **Bar Chart** — Weekly Attendance (Present/Absent/Late/WFH) with custom tooltip
- [ ] **Line Chart** — Monthly Leave Trends (Leaves/Sick/Casual/Annual)
- [ ] **Pie/Donut Chart** — Department Distribution (innerRadius=38, outerRadius=60)
- [ ] All charts: custom tooltips showing percentages

---

## 10. Navigation — Full Sidebar Items List

```javascript
const allNavItems = [
  { path: '/dashboard',            label: 'Dashboard',         icon: 'ri-dashboard-line',          roles: null },
  { path: '/employees',            label: 'Employees',         icon: 'ri-user-2-line',              roles: ['hr','admin','superAdmin'] },
  { path: '/hr-management',        label: 'HR Management',     icon: 'ri-user-settings-line',       roles: ['hr','admin','superAdmin'] },
  { path: '/attendance',           label: 'Attendance',        icon: 'ri-calendar-check-line',      roles: null },
  { path: '/leave',                label: 'Leave',             icon: 'ri-survey-line',              roles: null },
  { path: '/wfh',                  label: 'WFH Records',       icon: 'ri-home-office-line',         roles: null },
  { path: '/payroll',              label: 'Payroll',           icon: 'ri-money-dollar-circle-line', roles: ['hr','admin','superAdmin'] },
  { path: '/projects',             label: 'Projects',          icon: 'ri-folder-line',              roles: ['admin','superAdmin'] },
  { path: '/tasktimesheet',        label: 'Tasks & Timesheet', icon: 'ri-task-line',                roles: null },
  { path: '/assets',               label: 'Assets',            icon: 'ri-archive-stack-line',       roles: ['hr','admin','superAdmin'] },
  { path: '/inventory',            label: 'Inventory',         icon: 'ri-store-line',               roles: ['admin','superAdmin'] },
  { path: '/helpdesk',             label: 'Helpdesk',          icon: 'ri-customer-service-line',    roles: null },
  { path: '/announcements',        label: 'Announcements',     icon: 'ri-megaphone-line',           roles: null },
  { path: '/policies',             label: 'Policies',          icon: 'ri-file-list-line',           roles: null },
  { path: '/reports',              label: 'Reports',           icon: 'ri-survey-line',              roles: ['hr','admin','superAdmin'] },
  { path: '/notifications',        label: 'Notifications',     icon: 'ri-notification-line',        roles: null },
  { path: '/settings',             label: 'Settings',          icon: 'ri-equalizer-line',           roles: null },
  { path: '/role-management',      label: 'Role Management',   icon: 'ri-shield-user-line',         roles: ['admin','superAdmin'] },
  { path: '/audit-logs',           label: 'Audit Logs',        icon: 'ri-file-history-line',        roles: ['admin','superAdmin'] },
  { path: '/system-configuration', label: 'System Config',     icon: 'ri-settings-4-line',          roles: ['superAdmin'] },
];
```

---

## 11. Form Validation Rules

### Login Schema
```javascript
email:    required, valid email format
password: required
role:     required (current UI — remove when JWT role detection is added)
```

### Registration Schema
```javascript
name:        required
email:       required, valid email
phone:       optional
department:  required
designation: required
password:    required, min 6 chars, must include upper + lower + number
```

### Error Display Pattern
```jsx
// Always pair label htmlFor with input id (required for accessibility + testing)
<label htmlFor="email-field">Email</label>
<input id="email-field" name="email" className={errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'} />
{errors.email && (
  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
    <i className="ri-error-warning-line"></i> {errors.email}
  </p>
)}
```

---

## 12. Responsive Design

| Screen | Sidebar | Grid | Notes |
|---|---|---|---|
| < 640px | Collapsed (w-20) | 1 col | Icon-only sidebar |
| 640–767px | Collapsed | 1–2 col | Simplified header |
| 768–1023px | Expanded (w-75) | 2–3 col | Full header |
| ≥ 1024px | Expanded | 4 col | Full layout |

### Sidebar Mobile Behavior (to implement)
```javascript
useEffect(() => {
  const check = () => { if (window.innerWidth < 768) setCollapsed(true); };
  check();
  window.addEventListener('resize', check);
  return () => window.removeEventListener('resize', check); // cleanup required
}, []);
```

---

## 13. Component Library Patterns

### Status Badge
```jsx
const styles = {
  active: "bg-green-100 text-green-800", inactive: "bg-gray-100 text-gray-600",
  terminated: "bg-red-100 text-red-800", pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800", rejected: "bg-red-100 text-red-800",
};
<span className={`text-xs font-semibold px-2 py-1 rounded-full ${styles[status]}`}>{status}</span>
```

### Avatar (Initials)
```jsx
<div className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold"
     style={{ background: "#eff4ff", color: "#1a3fb5" }}>RS</div>
```

### Toast Notifications (to add)
```javascript
import { toast } from 'react-toastify';
toast.success("Employee created successfully");
toast.error("Failed to save changes");
toast.warning("Session expiring soon");
```

### Loading Button State
```jsx
<button disabled={isLoading} className="... disabled:opacity-50 disabled:cursor-not-allowed">
  {isLoading ? <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4">...</svg> Saving...</span> : "Save"}
</button>
```

### Error Display (API errors)
```jsx
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
    <i className="ri-error-warning-line text-red-500 text-lg"></i>
    <div>
      <p className="text-sm font-medium text-red-800">Something went wrong</p>
      <p className="text-xs text-red-600">{error}</p>
    </div>
    <button onClick={refetch} className="ml-auto text-xs text-red-600 underline">Retry</button>
  </div>
)}
```

---

## 14. Backend Middleware (Reference)

```javascript
// authenticate — verify JWT, attach user to req
// restrictTo(...roles) — block if role not in allowed list → 403
// requirePermission(permission) — block if permission missing → 403

// Example route protection:
router.post('/', restrictTo('hr', 'admin'), createEmployee);
router.get('/', requirePermission('employees:read'), getAllEmployees);
router.delete('/:id', restrictTo('hr', 'admin'), deleteEmployee);
```

---

## 15. Implementation Order

### Phase 1 — Foundation
1. `AuthContext` + `useApi` hook + `api.js` service
2. `ProtectedRoute` + `PublicRoute` wrappers
3. Sidebar role filtering + mobile responsive collapse
4. Header: dynamic username, role badge, logout button

### Phase 2 — Existing Pages (enhance)
5. Dashboard — role-based views, dynamic stats, activity feed
6. Employees — search, filter, detail modal, edit/delete, pagination
7. Leave — apply leave modal, balance tracker, calendar view
8. Attendance — bulk mark, late highlight, calendar view
9. Projects — assign employees, progress bar, kanban toggle
10. Tasks & Timesheet — priority levels, assign to employee, timer
11. Assets — return asset, history log, search/filter
12. Reports — charts, date range picker, export
13. Announcements — categories, pin, target audience
14. Settings — change password modal, profile picture

### Phase 3 — New Modules
15. WFH Records
16. Payroll
17. Helpdesk
18. Policies
19. Notifications
20. Role Management
21. Audit Logs
22. System Config
23. HR Management
24. Inventory

### Phase 4 — v1.1 Roadmap
- Real-time notifications (WebSocket)
- PDF generation (payslips, reports)
- Dark mode
- Multi-language (i18n)
- TypeScript migration
- CI/CD pipeline

---

## 16. Known Issues & Security Gaps

| Item | Priority | Fix |
|---|---|---|
| JWT in localStorage | High | Move to httpOnly cookies |
| CSRF protection | High | Add csurf middleware |
| No route protection | High | Implement ProtectedRoute/PublicRoute |
| Hardcoded user in Header | Medium | Connect to AuthContext |
| No toast notifications | Medium | Add react-toastify |
| Form labels missing htmlFor | Medium | Add id/htmlFor pairs on all inputs |
| 43 ESLint console.log warnings | Low | Remove before production |
| No loading states on buttons | Low | Add disabled + spinner pattern |

---

*Covers: All 20 modules, RBAC, Design System, Charts, Auth, API Layer, Forms, Responsive, Security.*
*Next review: June 2026*
