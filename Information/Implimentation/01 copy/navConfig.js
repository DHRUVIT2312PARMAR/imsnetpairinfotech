// ============================================================
//  navConfig.js  —  Single source of truth for ALL nav items
//  Roles: super_admin | admin | hr | employee
//  Drop this in:  src/config/navConfig.js
// ============================================================

/**
 * Each nav item:
 *  key        – unique identifier (also used as route key)
 *  label      – display name
 *  path       – react-router path
 *  icon       – Remix Icon class (ri-*)
 *  roles      – which roles can SEE this item
 *  badge      – optional: 'notifications' | 'leave_requests' | null
 *  children   – optional sub-menu array (same shape, no nested children)
 *  divider    – render a divider line BEFORE this item
 */

export const NAV_ITEMS = [
  {
    key:   'dashboard',
    label: 'Dashboard',
    path:  '/dashboard',
    icon:  'ri-dashboard-2-line',
    roles: ['super_admin', 'admin', 'hr', 'employee'],
  },
  {
    key:   'attendance',
    label: 'Attendance',
    path:  '/attendance',
    icon:  'ri-calendar-check-line',
    roles: ['super_admin', 'admin', 'hr', 'employee'],
    badge: 'attendance_pending',
  },
  {
    key:   'leave',
    label: 'Leave',
    path:  '/leave',
    icon:  'ri-calendar-todo-line',
    roles: ['super_admin', 'admin', 'hr', 'employee'],
    badge: 'leave_requests',
  },
  {
    key:   'helpdesk',
    label: 'Helpdesk',
    path:  '/helpdesk',
    icon:  'ri-headphone-line',
    roles: ['super_admin', 'admin', 'hr', 'employee'],
    badge: 'helpdesk_open',
  },
  {
    key:   'announcements',
    label: 'Announcements',
    path:  '/announcements',
    icon:  'ri-megaphone-line',
    roles: ['super_admin', 'admin', 'hr', 'employee'],
    badge: 'announcements_unread',
  },
  {
    key:      'settings',
    label:    'Settings',
    path:     '/settings',
    icon:     'ri-settings-3-line',
    roles:    ['super_admin', 'admin', 'hr', 'employee'],
    divider:  true,
  },
  {
    key:   'policies',
    label: 'Policies',
    path:  '/policies',
    icon:  'ri-file-list-3-line',
    roles: ['super_admin', 'admin', 'hr', 'employee'],
  },
  {
    key:   'tasks_timesheet',
    label: 'Tasks & Timesheet',
    path:  '/tasks-timesheet',
    icon:  'ri-task-line',
    roles: ['super_admin', 'admin', 'hr', 'employee'],
  },
  {
    key:   'employees',
    label: 'Employees',
    path:  '/employees',
    icon:  'ri-user-3-line',
    roles: ['super_admin', 'admin', 'hr'],
    divider: true,
  },
  {
    key:   'hr_management',
    label: 'HR Management',
    path:  '/hr-management',
    icon:  'ri-user-settings-line',
    roles: ['super_admin', 'admin', 'hr'],
    children: [
      { key: 'hr_onboarding',    label: 'Onboarding',    path: '/hr-management/onboarding',    icon: 'ri-user-add-line',    roles: ['super_admin','admin','hr'] },
      { key: 'hr_offboarding',   label: 'Offboarding',   path: '/hr-management/offboarding',   icon: 'ri-user-minus-line',  roles: ['super_admin','admin','hr'] },
      { key: 'hr_performance',   label: 'Performance',   path: '/hr-management/performance',   icon: 'ri-line-chart-line',  roles: ['super_admin','admin','hr'] },
    ],
  },
  {
    key:   'wfh_records',
    label: 'WFH Records',
    path:  '/wfh-records',
    icon:  'ri-home-office-line',
    roles: ['super_admin', 'admin', 'hr'],
  },
  {
    key:   'payroll',
    label: 'Payroll',
    path:  '/payroll',
    icon:  'ri-money-dollar-circle-line',
    roles: ['super_admin', 'admin', 'hr'],
  },
  {
    key:   'projects',
    label: 'Projects',
    path:  '/projects',
    icon:  'ri-folder-open-line',
    roles: ['super_admin', 'admin', 'hr', 'employee'],
  },
  {
    key:   'assets',
    label: 'Assets',
    path:  '/assets',
    icon:  'ri-archive-drawer-line',
    roles: ['super_admin', 'admin'],
    divider: true,
  },
  {
    key:   'reports',
    label: 'Reports',
    path:  '/reports',
    icon:  'ri-bar-chart-box-line',
    roles: ['super_admin', 'admin', 'hr'],
  },
  {
    key:   'inventory',
    label: 'Inventory',
    path:  '/inventory',
    icon:  'ri-store-2-line',
    roles: ['super_admin', 'admin'],
  },
  {
    key:   'role_management',
    label: 'Role Management',
    path:  '/role-management',
    icon:  'ri-shield-user-line',
    roles: ['super_admin'],
    divider: true,
  },
  {
    key:   'audit_logs',
    label: 'Audit Logs',
    path:  '/audit-logs',
    icon:  'ri-file-shield-2-line',
    roles: ['super_admin'],
  },
  {
    key:   'system_config',
    label: 'System Config',
    path:  '/system-config',
    icon:  'ri-settings-5-line',
    roles: ['super_admin'],
  },
];

/**
 * Returns filtered nav items for a given role.
 * Call this in your Sidebar component:
 *   const items = getNavForRole(user.role);
 */
export const getNavForRole = (role) =>
  NAV_ITEMS.filter((item) => item.roles.includes(role)).map((item) => ({
    ...item,
    children: item.children?.filter((c) => c.roles.includes(role)),
  }));

/**
 * Badge keys — map to API endpoints that return a count.
 * The Sidebar will poll these and show red dots.
 */
export const BADGE_ENDPOINTS = {
  attendance_pending:   '/api/attendance/pending-count',
  leave_requests:       '/api/leave/pending-count',
  helpdesk_open:        '/api/helpdesk/open-count',
  announcements_unread: '/api/announcements/unread-count',
};
