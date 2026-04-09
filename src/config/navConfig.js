// ============================================================
//  navConfig.js  —  Single source of truth for ALL nav items
//  Roles: superAdmin | admin | hr | employee
// ============================================================

export const NAV_ITEMS = [
  {
    key:   'dashboard',
    label: 'Dashboard',
    path:  '/dashboard',
    icon:  'ri-dashboard-2-line',
    roles: ['superAdmin', 'admin', 'hr', 'employee'],
  },
  {
    key:   'attendance',
    label: 'Attendance',
    path:  '/attendance',
    icon:  'ri-calendar-check-line',
    roles: ['superAdmin', 'admin', 'hr', 'employee'],
    badge: 'attendance_pending',
  },
  {
    key:   'leave',
    label: 'Leave',
    path:  '/leave',
    icon:  'ri-calendar-todo-line',
    roles: ['superAdmin', 'admin', 'hr', 'employee'],
    badge: 'leave_requests',
  },
  {
    key:   'helpdesk',
    label: 'Helpdesk',
    path:  '/helpdesk',
    icon:  'ri-headphone-line',
    roles: ['superAdmin', 'admin', 'hr', 'employee'],
    badge: 'helpdesk_open',
  },
  {
    key:   'announcements',
    label: 'Announcements',
    path:  '/announcements',
    icon:  'ri-megaphone-line',
    roles: ['superAdmin', 'admin', 'hr', 'employee'],
    badge: 'announcements_unread',
  },
  {
    key:      'settings',
    label:    'Settings',
    path:     '/settings',
    icon:     'ri-settings-3-line',
    roles:    ['superAdmin', 'admin', 'hr', 'employee'],
    divider:  true,
  },
  {
    key:   'policies',
    label: 'Policies',
    path:  '/policies',
    icon:  'ri-file-list-3-line',
    roles: ['superAdmin', 'admin', 'hr', 'employee'],
  },
  {
    key:   'tasks_timesheet',
    label: 'Tasks & Timesheet',
    path:  '/tasktimesheet',
    icon:  'ri-task-line',
    roles: ['superAdmin', 'admin', 'hr', 'employee'],
  },
  {
    key:   'employees',
    label: 'Employees',
    path:  '/employees',
    icon:  'ri-user-3-line',
    roles: ['superAdmin', 'admin', 'hr'],
    divider: true,
  },
  {
    key:   'hr_management',
    label: 'HR Management',
    path:  '/hr-management',
    icon:  'ri-user-settings-line',
    roles: ['superAdmin', 'admin', 'hr'],
    children: [
      { key: 'hr_onboarding',    label: 'Onboarding',    path: '/hr-management/onboarding',    icon: 'ri-user-add-line',    roles: ['superAdmin','admin','hr'] },
      { key: 'hr_offboarding',   label: 'Offboarding',   path: '/hr-management/offboarding',   icon: 'ri-user-minus-line',  roles: ['superAdmin','admin','hr'] },
      { key: 'hr_performance',   label: 'Performance',   path: '/hr-management/performance',   icon: 'ri-line-chart-line',  roles: ['superAdmin','admin','hr'] },
    ],
  },
  {
    key:   'wfh_records',
    label: 'WFH Records',
    path:  '/wfh',
    icon:  'ri-home-office-line',
    roles: ['superAdmin', 'admin', 'hr'],
  },
  {
    key:   'payroll',
    label: 'Payroll',
    path:  '/payroll',
    icon:  'ri-money-dollar-circle-line',
    roles: ['superAdmin', 'admin', 'hr', 'employee'],
  },
  {
    key:   'projects',
    label: 'Projects',
    path:  '/projects',
    icon:  'ri-folder-open-line',
    roles: ['superAdmin', 'admin', 'hr', 'employee'],
  },
  {
    key:   'assets',
    label: 'Assets',
    path:  '/assets',
    icon:  'ri-archive-drawer-line',
    roles: ['superAdmin', 'admin', 'hr'],
    divider: true,
  },
  {
    key:   'reports',
    label: 'Reports',
    path:  '/reports',
    icon:  'ri-bar-chart-box-line',
    roles: ['superAdmin', 'admin'],
  },
  {
    key:   'inventory',
    label: 'Inventory',
    path:  '/inventory',
    icon:  'ri-store-2-line',
    roles: ['superAdmin', 'admin'],
  },
  {
    key:   'role_management',
    label: 'Role Management',
    path:  '/role-management',
    icon:  'ri-shield-user-line',
    roles: ['superAdmin', 'admin'],
    divider: true,
  },
  {
    key:   'audit_logs',
    label: 'Audit Logs',
    path:  '/audit-logs',
    icon:  'ri-file-shield-2-line',
    roles: ['superAdmin', 'admin'],
  },
  {
    key:   'system_config',
    label: 'System Config',
    path:  '/system-configuration',
    icon:  'ri-settings-5-line',
    roles: ['superAdmin'],
  },
];

/**
 * Returns filtered nav items for a given role.
 */
export const getNavForRole = (role) => {
  const normalizedRole = role?.toLowerCase() === 'superadmin' ? 'superAdmin' : role;
  return NAV_ITEMS.filter((item) => item.roles.includes(normalizedRole)).map((item) => ({
    ...item,
    children: item.children?.filter((c) => c.roles.includes(normalizedRole)),
  }));
};

/**
 * Badge keys — map to API endpoints that return a count.
 */
export const BADGE_ENDPOINTS = {
  attendance_pending:   '/attendance/pending-count',
  leave_requests:       '/leaves/pending-count',
  helpdesk_open:        '/tickets/open-count',
  announcements_unread: '/announcements/unread-count',
};
