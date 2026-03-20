// src/utils/roleUtils.js
// Role utility helpers — NetPair IMS v2.1

export const isEmployee   = r => r === 'employee';
export const isHR         = r => r === 'hr';
export const isAdmin      = r => r === 'admin';
export const isSuperAdmin = r => r === 'superAdmin' || r === 'superadmin';

export const isHROrAbove    = r => ['hr', 'admin', 'superAdmin', 'superadmin'].includes(r);
export const isAdminOrAbove = r => ['admin', 'superAdmin', 'superadmin'].includes(r);

// Module-specific helpers (v2.1)
export const canSendAnnouncements  = r => ['hr', 'admin', 'superAdmin', 'superadmin'].includes(r);
export const canManageRoles        = r => ['admin', 'superAdmin', 'superadmin'].includes(r);   // Admin full CRUD
export const canManageProjects     = r => ['hr', 'superAdmin', 'superadmin'].includes(r);      // HR full CRUD
export const canApproveLeave       = r => ['hr', 'superAdmin', 'superadmin'].includes(r);
export const canManagePayroll      = r => ['hr', 'superAdmin', 'superadmin'].includes(r);
export const canManagePolicies     = r => ['admin', 'superAdmin', 'superadmin'].includes(r);
export const canApprovePolicies    = r => isSuperAdmin(r);
export const canEditSystemSettings = r => ['admin', 'superAdmin', 'superadmin'].includes(r);
export const canEditAdvancedConfig = r => isSuperAdmin(r);
export const canViewHRConfig       = r => ['hr', 'admin', 'superAdmin', 'superadmin'].includes(r);
export const canManageEmployees    = r => ['hr', 'superAdmin', 'superadmin'].includes(r);
export const canManageAssets       = r => ['hr', 'superAdmin', 'superadmin'].includes(r);
export const canViewReports        = r => ['admin', 'superAdmin', 'superadmin'].includes(r);
export const canManageInventory    = r => ['admin', 'superAdmin', 'superadmin'].includes(r);
export const canViewAuditLogs      = r => isSuperAdmin(r);
export const canAccessSystemConfig = r => isSuperAdmin(r);
