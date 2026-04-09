# ⚡ FAST IMPLEMENTATION PROMPT
# Copy this entire prompt and paste it to Claude/GPT to implement in one shot.
# Fill in the [BRACKETS] before pasting.

---

You are a senior full-stack engineer. Implement the following features EXACTLY as described, production-ready, no placeholders, no TODOs. Output all files in full.

## PROJECT CONTEXT
- Stack: React 18 + Vite, Tailwind CSS, React Router v6, Axios (api.js instance), Express.js, PostgreSQL (pg pool)
- Auth: JWT in httpOnly cookie, req.user set by authenticate middleware
- Roles: super_admin | admin | hr | employee
- Icons: Remix Icon (ri-*) via CDN already in index.html
- Toast: react-toastify already configured
- useAuth() hook exposes: { user, login, logout, register }

## FILE STRUCTURE TO CREATE
1. `src/config/navConfig.js`        – nav items with roles/icons/badges/children
2. `src/components/layout/Sidebar.jsx` – collapsible sidebar, role-filtered, badge counts
3. `src/components/layout/Navbar.jsx`  – topbar with notifications panel + profile dropdown
4. `src/components/layout/Layout.jsx`  – wrapper using <Outlet />
5. `src/routes/navRoutes.js`           – Express routes for notifications + badge counts
6. `src/controllers/navController.js`  – all controller logic

## REQUIREMENTS

### Sidebar
- Width: 240px expanded, 64px collapsed. Toggle stored in localStorage.
- Collapse button: small circle on right edge of sidebar.
- NavLink active state: orange left accent bar + orange text + orange-50 bg.
- Sub-menus: animate open/close with max-height transition. Auto-open if child is active.
- Badge counts: red pill on label, red dot when collapsed. Poll every 60s from API.
- Bottom mini user card when expanded.
- Tooltip on hover when collapsed.

### Navbar
- Fixed top, left offset matches sidebar width via transition.
- Left: Welcome, [firstName]! / Today is [weekday date]
- Right (left to right): Role badge pill → Profile button → divider → EN → dark-mode → bell → Logout
- Role badge colors: super_admin=red, admin=orange, hr=purple, employee=blue
- Notifications panel: dropdown, max 10, unread dot, mark-read on click, mark-all button. Poll count every 30s.
- Profile dropdown: avatar + name + email header, My Profile / Settings / Change Password links, Logout at bottom.
- Dark mode: toggle class on <html>, persist to localStorage.
- Close dropdowns on outside click using useRef + mousedown listener.

### Backend
- GET  /api/notifications?limit=10          → { data: [...] }
- GET  /api/notifications/unread-count      → { count: N }
- PATCH /api/notifications/:id/read         → mark single read
- PATCH /api/notifications/read-all         → mark all read
- GET  /api/attendance/pending-count        → { count: N } (role-aware)
- GET  /api/leave/pending-count             → { count: N } (role-aware)
- GET  /api/helpdesk/open-count             → { count: N } (role-aware)
- GET  /api/announcements/unread-count      → { count: N }

### DB additions needed
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  icon VARCHAR(60) DEFAULT 'ri-notification-3-line',
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_read ON notifications(is_read);
```

### Nav items with role access
| Key              | Roles                              | Badge                  | Has sub-menu |
|------------------|------------------------------------|------------------------|--------------|
| dashboard        | all                                | –                      | no           |
| attendance       | all                                | attendance_pending     | no           |
| leave            | all                                | leave_requests         | no           |
| helpdesk         | all                                | helpdesk_open          | no           |
| announcements    | all                                | announcements_unread   | no           |
| settings         | all                                | –                      | no (divider before) |
| policies         | all                                | –                      | no           |
| tasks_timesheet  | all                                | –                      | no           |
| employees        | super_admin, admin, hr             | –                      | no (divider before) |
| hr_management    | super_admin, admin, hr             | –                      | YES (Onboarding, Offboarding, Performance) |
| wfh_records      | super_admin, admin, hr             | –                      | no           |
| payroll          | super_admin, admin, hr             | –                      | no           |
| projects         | all                                | –                      | no           |
| assets           | super_admin, admin                 | –                      | no (divider before) |
| reports          | super_admin, admin, hr             | –                      | no           |
| inventory        | super_admin, admin                 | –                      | no           |
| role_management  | super_admin                        | –                      | no (divider before) |
| audit_logs       | super_admin                        | –                      | no           |
| system_config    | super_admin                        | –                      | no           |

## OUTPUT FORMAT
Output each file as a separate code block with the filename as the heading.
Do NOT abbreviate. Output complete, copy-paste ready code for every file.
Start immediately, no preamble.
