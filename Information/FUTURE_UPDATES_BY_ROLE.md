# NetPair IMS — Future Updates by Role
**Last Updated:** March 2026
**Purpose:** Planned features and improvements, organized by which role benefits from them.

---

## SUPER ADMIN

### High Priority
| # | Feature | Description | Pages Affected |
|---|---------|-------------|----------------|
| 1 | Real audit trail | Wire `auditLogController.log()` into all controllers — login, logout, CRUD, role changes, approvals | Audit Logs |
| 2 | User deactivate / reactivate | Toggle `isActive` on any user account from Role Management | Role Management |
| 3 | System config persistence | System Config saves to DB but backend restart reloads defaults — fix default merge logic | System Config |
| 4 | Bulk role assignment | Select multiple users and change role in one action | Role Management |
| 5 | SuperAdmin approval queue | Pending policy approvals and system config changes need real approval workflow | Dashboard |

### Medium Priority
| # | Feature | Description |
|---|---------|-------------|
| 6 | Audit log export PDF | Currently exports CSV only — add PDF export with filters |
| 7 | Login history per user | Show last 5 login IPs and timestamps on user profile |
| 8 | System health dashboard | Real DB connection status, API response times, active sessions count |
| 9 | Backup & restore config | Export/import system config as JSON |
| 10 | Force logout any user | SuperAdmin can invalidate any user's session |

---

## ADMIN

### High Priority
| # | Feature | Description | Pages Affected |
|---|---------|-------------|----------------|
| 1 | Reports — real department filter | Fetch departments from `/api/v1/employees` instead of hardcoded list | Reports |
| 2 | Reports — employee name search | Add search box to attendance records table | Reports |
| 3 | Reports — PDF export fix | `generateAttendanceReportPDF` uses old field names — update to match new schema | Reports |
| 4 | Inventory low-stock alerts | Email/notification when item qty drops below minQty | Inventory |
| 5 | Policies — version history | Track when a policy was last updated and by whom | Policies |

### Medium Priority
| # | Feature | Description |
|---|---------|-------------|
| 6 | Announcements — scheduled publish | Set `publishedAt` in the future — announcement goes live automatically |
| 7 | Announcements — expiry auto-hide | Expired announcements should be visually marked and filterable |
| 8 | Role Management — permission override | Admin can grant/revoke individual permissions per user (extraPermissions / blockedPermissions) |
| 9 | Reports — leave trend chart | Add leave usage trend over 6 months alongside attendance trend |
| 10 | Reports — payroll summary | Add total payroll disbursed per month chart |
| 11 | Inventory — reorder alerts | Auto-create helpdesk ticket when stock hits minimum |
| 12 | Task assignment from employee list | Assign task directly from Employees page |

---

## HR

### High Priority
| # | Feature | Description | Pages Affected |
|---|---------|-------------|----------------|
| 1 | Leave balance — dynamic calculation | `EmployeeAttendance.jsx` calls `/leaves/balance` without employee ID — fix to use real balance | Attendance, Leave |
| 2 | Payroll — bulk generate | Generate payroll for all active employees in one click for a given month | Payroll |
| 3 | Payroll — PDF payslip fix | `generatePayslipPDF` uses old field names — update to match Payroll model | Payroll |
| 4 | Email on leave approve/reject | Send Brevo email to employee when HR approves or rejects leave | Leave |
| 5 | WFH — calendar view | Add monthly calendar showing WFH days per employee | WFH |
| 6 | HR Management — onboarding checklist save | Checklist state is local only — save to DB per employee | HR Management |
| 7 | Assets — assign to employee | Asset assignment currently has no employee picker — add employee dropdown | Assets |

### Medium Priority
| # | Feature | Description |
|---|---------|-------------|
| 8 | Employee — bulk import CSV | Upload CSV to create multiple employees at once |
| 9 | Employee — export to PDF/Excel | Export employee list with filters |
| 10 | Payroll — tax calculation | Auto-calculate TDS based on salary slab |
| 11 | Leave — carry-forward logic | Implement carry-forward based on System Config setting |
| 12 | WFH — approval email | Notify employee when WFH request is approved/rejected |
| 13 | HR Management — department CRUD | Create/edit/delete departments from HR Management page |
| 14 | Projects — team member picker | Project creation modal has no employee picker for team members |
| 15 | Projects — progress tracking | Update project progress % from task completion |

---

## EMPLOYEE

### High Priority
| # | Feature | Description | Pages Affected |
|---|---------|-------------|----------------|
| 1 | Tasks — Add Task modal real employees | Dropdown has 3 hardcoded names — fetch from `/api/v1/employees` | Tasks/Timesheet |
| 2 | Leave balance — real data | Leave balance in Attendance page shows `—` — connect to real balance endpoint | Attendance |
| 3 | Payroll — own payslips view | Employee can see their own payslips but PDF download uses wrong field names | Payroll |
| 4 | Profile photo upload | Settings page shows initials only — add photo upload to profile | Settings/Profile |
| 5 | Notifications — DELETE endpoint | Bell icon delete button calls `DELETE /notifications/:id` which doesn't exist | Notifications |

### Medium Priority
| # | Feature | Description |
|---|---------|-------------|
| 6 | Attendance — regularization status | Employee submits regularization but has no way to track its status |
| 7 | Tasks — time logging | Employee can update task status but cannot log actual hours worked |
| 8 | Tasks — comments/notes | No way to add notes or comments to a task |
| 9 | Helpdesk — ticket updates | Employee cannot see when their ticket status changes — add notification |
| 10 | WFH — recurring request | Can only request one day at a time — add date range picker |
| 11 | Leave — cancel applied leave | Employee cannot cancel a pending leave request |
| 12 | Projects — assigned view | Employee sees all projects — should filter to only assigned ones |
| 13 | Announcements — mark all read | No "mark all as read" button on the announcements page |

---

## ALL ROLES

### High Priority
| # | Feature | Description |
|---|---------|-------------|
| 1 | Hardcoded image paths | `Sidebar.jsx` and `Header.jsx` use `src="src/assets/..."` — breaks production build |
| 2 | Pagination UI | All list pages load up to 200 records — add Prev/Next pagination controls |
| 3 | Dark mode — remaining pages | Some pages still missing `dark:` classes (Reports, HR Management, Role Management) |
| 4 | Real-time notifications | Socket.IO is set up but not pushing events — wire push on leave approve, task assign, etc. |
| 5 | Error boundaries | No React error boundary — one crash takes down the whole app |

### Medium Priority
| # | Feature | Description |
|---|---------|-------------|
| 6 | Mobile responsive sidebar | Sidebar collapses on mobile but nav items are hard to tap |
| 7 | Loading skeletons consistency | Some pages have skeletons, some show blank — standardize |
| 8 | Empty state illustrations | Empty states show text only — add simple SVG illustrations |
| 9 | Toast position | Toasts appear top-right — move to bottom-right to avoid blocking header |
| 10 | i18n — Hindi translations | i18n is set up but Hindi locale file is mostly empty |
| 11 | Session timeout warning | No warning before JWT expires — user gets logged out silently |
| 12 | Keyboard navigation | Modals and dropdowns not keyboard-accessible |

---

## PRODUCTION BLOCKERS (all roles affected)

| # | Issue | Priority |
|---|-------|----------|
| 1 | Rotate JWT_SECRET, MONGODB_URI, BREVO_API_KEY | 🔴 Critical |
| 2 | Set `NODE_ENV=production` | 🔴 Critical |
| 3 | Cookie `secure: true` + `sameSite: "none"` for HTTPS | 🔴 Critical |
| 4 | Update `FRONTEND_URL` to production domain | 🔴 Critical |
| 5 | Apply `express-mongo-sanitize` middleware | 🟡 High |
| 6 | Add global rate limiter on all routes | 🟡 High |
| 7 | Remove `console.log` from `authController.js` | 🟡 High |
| 8 | Fix hardcoded image paths (Sidebar, Header) | 🟡 High |

---

## TOTAL COUNT

```
SuperAdmin future updates:   10
Admin future updates:        12
HR future updates:           15
Employee future updates:     13
All-roles updates:           12
Production blockers:          8
─────────────────────────────
Total planned updates:       70
```

---

## SIDEBAR — CURRENT STATE & PLANNED IMPROVEMENTS

### Current Sidebar Nav Per Role

#### Employee (10 items)
```
✅ Dashboard          /dashboard
✅ Attendance         /attendance       → Own view: clock in/out, history
✅ Leave              /leave            → Apply + view own leaves
✅ Helpdesk           /helpdesk         → Own tickets only
✅ Announcements      /announcements    → View only (no create)
✅ Settings           /settings         → Own profile
✅ Policies           /policies         → View + acknowledge only
✅ Tasks-Timesheet    /tasktimesheet    → Own tasks only, status update
✅ Payroll            /payroll          → Own payslips only
✅ Projects           /projects         → Assigned projects only
```

#### HR (15 items)
```
✅ Dashboard          /dashboard        → HR dashboard
✅ Attendance         /attendance       → All employees view + mark
✅ Leave              /leave            → All leaves + approve/reject
✅ Helpdesk           /helpdesk         → All tickets + update status
✅ Announcements      /announcements    → Create (hr+employee targets) + view
✅ Settings           /settings         → Own profile
✅ Policies           /policies         → View only
✅ Tasks-Timesheet    /tasktimesheet    → View all tasks (read only)
✅ Employees          /employees        → Full CRUD
✅ HR Management      /hr-management    → Onboarding + departments
✅ WFH Records        /wfh              → All requests + approve/reject
✅ Payroll            /payroll          → Full CRUD + generate + mark paid
✅ Projects           /projects         → Full CRUD
✅ Assets             /assets           → Full CRUD
```

#### Admin (17 items)
```
✅ Dashboard          /dashboard        → Admin dashboard with stats
✅ Attendance         /attendance       → View + approve
✅ Leave              /leave            → View + approve
✅ Helpdesk           /helpdesk         → All tickets + update status
✅ Announcements      /announcements    → Create (admin+hr+employee) + view
✅ Settings           /settings         → Own profile
✅ Policies           /policies         → Full CRUD
✅ Tasks-Timesheet    /tasktimesheet    → Assign + view all
✅ Employees          /employees        → View only
✅ HR Management      /hr-management    → View only
✅ WFH Records        /wfh              → View only
✅ Payroll            /payroll          → View only (budget oversight)
✅ Projects           /projects         → View only (resource planning)
✅ Assets             /assets           → View only (asset register)
✅ Reports            /reports          → Full + export
✅ Inventory          /inventory        → Full CRUD
✅ Role Management    /role-management  → Change user roles
✅ Audit Logs         /audit-logs       → View only
```

#### SuperAdmin (19 items — all of Admin + 1 extra)
```
✅ All Admin items above
✅ System Config      /system-configuration → Full system settings
   + Advanced mode toggle on Dashboard (full CRUD everywhere)
```

---

### Sidebar — Planned Future Improvements

#### 🔴 High Priority

| # | Role | Feature | Description |
|---|------|---------|-------------|
| 1 | All | Fix hardcoded logo path | `src="src/assets/imgs/image-removebg-preview.png"` breaks prod build — use `import logo` |
| 2 | All | Active route highlight bug | On page refresh, active item loses highlight — fix with `NavLink` `end` prop |
| 3 | Employee | My Payslips label | Sidebar shows "Payroll" for employee — should say "My Payslips" |
| 4 | Employee | My Projects label | Sidebar shows "Projects" for employee — should say "My Projects" |
| 5 | All | Notification badge on sidebar | Show unread count badge next to a "Notifications" sidebar item |
| 6 | All | Sidebar section dividers | Group nav items with visual dividers (e.g. "My Workspace" / "Management" / "Admin") |

#### 🟡 Medium Priority

| # | Role | Feature | Description |
|---|------|---------|-------------|
| 7 | All | Sidebar tooltips on collapse | When collapsed, hovering an icon should show a tooltip with the page name |
| 8 | All | Mobile overlay sidebar | On mobile, sidebar should slide over content with a backdrop, not push it |
| 9 | HR/Admin | Quick action shortcuts | Add small action buttons next to nav items (e.g. "+" next to Employees) |
| 10 | SuperAdmin | Mode indicator in sidebar | Show "Primary" / "Advanced" mode badge in sidebar when in SuperAdmin mode |
| 11 | All | Recently visited pages | Show last 3 visited pages at the top of sidebar |
| 12 | All | Sidebar search | Add a search box at top of sidebar to jump to any page |

#### 🟢 Nice to Have

| # | Role | Feature | Description |
|---|------|---------|-------------|
| 13 | All | Dark mode sidebar | Sidebar background stays white in dark mode — add `dark:bg-gray-900 dark:border-gray-700` |
| 14 | All | Sidebar animation | Smoother collapse/expand with icon transition |
| 15 | All | Keyboard shortcut | Press `[` to toggle sidebar collapse |
| 16 | Admin/SuperAdmin | Pending count badges | Show count of pending leaves, WFH requests, tickets next to their nav items |

---

### Sidebar — Planned New Nav Items (Future Phases)

| Nav Item | Route | Roles | Phase |
|----------|-------|-------|-------|
| My Attendance (renamed) | `/attendance` | employee | Rename label only |
| My Payslips (renamed) | `/payroll` | employee | Rename label only |
| My Projects (renamed) | `/projects` | employee | Rename label only |
| Notifications | `/notifications` | all | Add as sidebar item with unread badge |
| Calendar | `/calendar` | all | New page — unified leave + WFH + attendance calendar |
| Performance | `/performance` | employee, hr | New page — KPIs, goals, reviews |
| Recruitment | `/recruitment` | hr, superadmin | New page — job postings, applicants |
| Training | `/training` | all | New page — courses, certifications |
| Expenses | `/expenses` | employee, hr, admin | New page — expense claims and approvals |
| Org Chart | `/org-chart` | all | New page — visual company hierarchy |

---

### Sidebar — Implementation Status Summary

```
Total current nav items:
  Employee:    10 / 10  ✅ all implemented
  HR:          14 / 14  ✅ all implemented
  Admin:       18 / 18  ✅ all implemented
  SuperAdmin:  19 / 19  ✅ all implemented

Planned sidebar improvements:   16
Planned new nav items:          10
```
