/**
 * Single source of truth for all role values.
 * Import this wherever roles are referenced — never use raw strings.
 */

const ROLES = Object.freeze({
  SUPER_ADMIN: "superAdmin",
  ADMIN:       "admin",
  HR:          "hr",
  EMPLOYEE:    "employee",
});

/** All valid role values as an array — use for Mongoose enum */
const ALL_ROLES = Object.values(ROLES);

/**
 * Role hierarchy — who can target whom in announcements.
 * Key   = creator's role
 * Value = roles they are allowed to target
 */
const ROLE_HIERARCHY = Object.freeze({
  [ROLES.SUPER_ADMIN]: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
  [ROLES.ADMIN]:       [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
  [ROLES.HR]:          [ROLES.HR, ROLES.EMPLOYEE],
  [ROLES.EMPLOYEE]:    [],   // cannot create announcements
});

/** Roles that can create/manage announcements */
const ANNOUNCEMENT_CREATORS = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR];

/** Roles that can approve/reject leave, attendance, WFH */
const APPROVER_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR];

/** Roles with full system access */
const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

module.exports = { ROLES, ALL_ROLES, ROLE_HIERARCHY, ANNOUNCEMENT_CREATORS, APPROVER_ROLES, ADMIN_ROLES };
