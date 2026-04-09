/**
 * Frontend role constants — single source of truth.
 * Must match backend/constants/roles.js exactly.
 */
export const ROLES = Object.freeze({
  SUPER_ADMIN: "superAdmin",
  ADMIN:       "admin",
  HR:          "hr",
  EMPLOYEE:    "employee",
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.ADMIN]:       "Admin",
  [ROLES.HR]:          "HR",
  [ROLES.EMPLOYEE]:    "Employee",
});

export const ROLE_COLORS = Object.freeze({
  [ROLES.SUPER_ADMIN]: { bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500"    },
  [ROLES.ADMIN]:       { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  [ROLES.HR]:          { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  [ROLES.EMPLOYEE]:    { bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500"   },
});

/** Roles that can create announcements */
export const ANNOUNCEMENT_CREATORS = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR];
