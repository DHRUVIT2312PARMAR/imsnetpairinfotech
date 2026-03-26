const jwt  = require("jsonwebtoken");
const User = require("../models/User");

// ─── Role → Permission Map ────────────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  superAdmin: ["*"],
  admin: [
    // Employees — view only
    "employees:read",
    // Attendance — view + approve
    "attendance:read", "attendance:create", "attendance:update",
    // Leave — view + approve
    "leaves:read", "leaves:approve",
    // Payroll — view only (budget oversight)
    "payroll:read",
    // Projects — view only (resource planning)
    "projects:read",
    // Assets — view only (asset register)
    "assets:read",
    // Tasks — assign + view
    "tasks:create", "tasks:read", "tasks:update", "tasks:delete",
    // Reports — full
    "reports:read", "reports:generate",
    // Policies — full CRUD
    "policies:read", "policies:create", "policies:update", "policies:delete",
    // Inventory — full CRUD
    "inventory:read", "inventory:create", "inventory:update", "inventory:delete",
    // Announcements — create + view
    "announcements:create", "announcements:read", "announcements:delete",
    // Role management — full CRUD
    "roles:read", "roles:create", "roles:update", "roles:delete",
    // Audit logs — view only
    "audit-logs:read",
    // Helpdesk — view + respond
    "helpdesk:read", "helpdesk:update",
    // WFH — view
    "wfh:read",
    // HR Management — view
    "hr-management:read",
    // Notifications + settings
    "notifications:read",
    "settings:read", "settings:update",
    "users:read", "users:update",
  ],
  hr: [
    // Employees — full CRUD
    "employees:create", "employees:read", "employees:update", "employees:delete",
    // Attendance — full CRUD
    "attendance:create", "attendance:read", "attendance:update",
    // Leave — full CRUD + approve
    "leaves:create", "leaves:read", "leaves:update", "leaves:approve",
    // Payroll — full CRUD
    "payroll:create", "payroll:read", "payroll:update",
    // Projects — full CRUD
    "projects:create", "projects:read", "projects:update", "projects:delete",
    // Assets — full CRUD
    "assets:create", "assets:read", "assets:update", "assets:delete",
    // Tasks — view (workload management)
    "tasks:read",
    // HR Management — full
    "hr-management:read", "hr-management:update",
    // WFH — full CRUD
    "wfh:create", "wfh:read", "wfh:update",
    // Helpdesk — view + respond
    "helpdesk:read", "helpdesk:update",
    // Announcements — create + view
    "announcements:create", "announcements:read",
    // Reports — view only
    "reports:read",
    // Policies — view only
    "policies:read",
    // Notifications + settings
    "notifications:read",
    "settings:read",
    "users:read",
  ],
  employee: [
    // Own attendance
    "attendance:read", "attendance:create",
    // Own leave
    "leaves:create", "leaves:read",
    // Own tasks
    "tasks:read", "tasks:update",
    // Own payslips
    "payroll:read",
    // Assigned projects
    "projects:read",
    // Helpdesk — own tickets
    "helpdesk:read", "helpdesk:create",
    // Announcements — view only
    "announcements:read",
    // WFH — own requests
    "wfh:create", "wfh:read",
    // Notifications + settings + policies
    "notifications:read",
    "settings:read",
    "policies:read",
    "employees:read",
  ],
};

// ─── Helper: compute final permissions for a user ────────────────────────────
const getUserPermissions = (user) => {
  if (user.role === "superAdmin") return ["*"];
  const base    = ROLE_PERMISSIONS[user.role] || [];
  const extras  = user.extraPermissions  || [];
  const blocked = user.blockedPermissions || [];
  return [...new Set([...base, ...extras])].filter(p => !blocked.includes(p));
};

// ─── Guard 1: authenticate ────────────────────────────────────────────────────
// Verifies JWT, checks isActive, attaches req.user
const authenticate = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token)
      return res.status(401).json({ success: false, message: "Authentication required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select("+extraPermissions +blockedPermissions");

    if (!user)
      return res.status(401).json({ success: false, message: "User no longer exists" });

    if (!user.isActive)
      return res.status(401).json({ success: false, message: "Account is deactivated" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// ─── Guard 2: restrictTo (role-level) ────────────────────────────────────────
// Quick role check — use when you don't need fine-grained permissions
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied — insufficient role",
    });
  }
  next();
};

// ─── Guard 3: requirePermission (permission-level) ───────────────────────────
// Checks role permissions + extraPermissions - blockedPermissions
const requirePermission = (permission) => (req, res, next) => {
  const perms = getUserPermissions(req.user);
  if (perms.includes("*") || perms.includes(permission)) return next();
  return res.status(403).json({
    success: false,
    message: `Permission denied — requires: ${permission}`,
  });
};

// ─── Guard 4: requireOwnership ───────────────────────────────────────────────
// Ensures employee can only access their own resources
// Usage: requireOwnership("employeeId") — checks req.params.id or req.body.employeeId
const requireOwnership = (field = "employeeId") => async (req, res, next) => {
  // admin, hr, superAdmin bypass ownership check
  if (["admin", "hr", "superAdmin"].includes(req.user.role)) return next();

  const resourceId = req.params.id || req.body[field] || req.query[field];
  const userEmpRef = req.user.employeeRef?.toString();

  if (!resourceId || !userEmpRef || resourceId !== userEmpRef) {
    return res.status(403).json({
      success: false,
      message: "Access denied — not your resource",
    });
  }
  next();
};

module.exports = {
  authenticate,
  restrictTo,
  requirePermission,
  requireOwnership,
  getUserPermissions,
  ROLE_PERMISSIONS,
};
