const jwt  = require("jsonwebtoken");
const User = require("../models/User");

// ─── Role → Permission Map ────────────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  superAdmin: ["*"],
  admin: [
    "employees:create", "employees:read", "employees:update", "employees:delete",
    "attendance:create", "attendance:read", "attendance:update", "attendance:delete",
    "leaves:create",    "leaves:read",    "leaves:update",    "leaves:approve",
    "projects:create",  "projects:read",  "projects:update",  "projects:delete",
    "tasks:create",     "tasks:read",     "tasks:update",     "tasks:delete",
    "assets:create",    "assets:read",    "assets:update",    "assets:delete",
    "payroll:create",   "payroll:read",   "payroll:update",   "payroll:delete",
    "reports:read",     "reports:generate",
    "announcements:create", "announcements:read", "announcements:delete",
    "notifications:read",
    "settings:read",    "settings:update",
    "users:read",       "users:update",
  ],
  hr: [
    "employees:create", "employees:read", "employees:update",
    "attendance:create","attendance:read","attendance:update",
    "leaves:create",    "leaves:read",   "leaves:update",    "leaves:approve",
    "payroll:create",   "payroll:read",  "payroll:update",
    "reports:read",     "reports:generate",
    "assets:read",
    "announcements:create", "announcements:read",
    "notifications:read",
    "settings:read",
    "users:read",
  ],
  employee: [
    "employees:read",
    "attendance:read",  "attendance:create",
    "leaves:create",    "leaves:read",
    "tasks:read",       "tasks:update",
    "projects:read",
    "announcements:read",
    "notifications:read",
    "payroll:read",
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
