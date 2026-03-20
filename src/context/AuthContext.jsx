import React, { createContext, useContext, useState } from "react";
import api from "../services/api";

// Role-based permission matrix — v2.1
// SuperAdmin: primary (view+approve) + advanced (full CRUD)
// Admin: system operations — role mgmt, policies, inventory, reports
// HR: people operations — employees, attendance, leave, payroll, projects, assets
// Employee: own workspace only
const rolePermissions = {
  superAdmin: ["*"],
  admin: [
    // Role management — Admin full CRUD
    "roles:read", "roles:write", "roles:delete",
    // Attendance — view + approve (not day-to-day manage)
    "attendance:read", "attendance:approve",
    // Leave — view + approve
    "leaves:read", "leaves:approve",
    // Employees — view only (HR manages CRUD)
    "employees:read",
    // Reports — full
    "reports:read", "reports:generate",
    // Policies — full CRUD (SuperAdmin approves)
    "policies:read", "policies:write", "policies:delete",
    // Helpdesk — own + HR + employee tickets
    "helpdesk:read", "helpdesk:write",
    // Inventory — full CRUD
    "inventory:read", "inventory:write", "inventory:delete",
    // Announcements — send + view
    "announcements:read", "announcements:write",
    // Tasks — assign + view
    "tasks:read", "tasks:write",
    // Settings — system settings + edit
    "settings:read", "settings:write",
    // WFH — view
    "wfh:read",
    // HR Management — view
    "hr-management:read",
    // Notifications
    "notifications:read",
    // Own profile + clock + leave
    "profile:read", "profile:write",
    "attendance:write",
    "leaves:write",
  ],
  hr: [
    // Employees — full CRUD
    "employees:read", "employees:write", "employees:delete",
    // Attendance — full CRUD
    "attendance:read", "attendance:write", "attendance:manage",
    // Leave — full CRUD + approve
    "leaves:read", "leaves:write", "leaves:approve",
    // Payroll — full CRUD
    "payroll:read", "payroll:write",
    // Projects — full CRUD (HR owns)
    "projects:read", "projects:write", "projects:delete",
    // Assets — full CRUD
    "assets:read", "assets:write", "assets:delete",
    // HR Management
    "hr-management:read", "hr-management:write",
    // WFH — full CRUD
    "wfh:read", "wfh:write",
    // Helpdesk — HR + employee tickets
    "helpdesk:read", "helpdesk:write",
    // Announcements — send + view
    "announcements:read", "announcements:write",
    // Reports — view only
    "reports:read",
    // Policies — view only (Admin manages)
    "policies:read",
    // Settings — personal only (view HR config)
    "settings:read",
    // Notifications
    "notifications:read",
    // Own profile + clock + leave
    "profile:read", "profile:write",
    "attendance:write",
    "leaves:write",
  ],
  employee: [
    // Own workspace only
    "profile:read", "profile:write",
    "attendance:read", "attendance:write",
    "leaves:read", "leaves:write",
    "tasks:read", "tasks:write",
    "helpdesk:read", "helpdesk:write",
    "announcements:read",
    "wfh:read", "wfh:write",
    "notifications:read",
    "settings:read",
    "policies:read",
  ],
};

const AuthContext = createContext(null);

// Read auth state synchronously from localStorage (before first render)
const getInitialState = () => {
  try {
    const stored = localStorage.getItem("user");
    if (stored) return { user: JSON.parse(stored), isAuthenticated: true };
  } catch {
    localStorage.removeItem("user");
  }
  return { user: null, isAuthenticated: false };
};

export const AuthProvider = ({ children }) => {
  const initial = getInitialState();
  const [user, setUser]                   = useState(initial.user);
  const [isAuthenticated, setIsAuthenticated] = useState(initial.isAuthenticated);
  const [loading, setLoading]             = useState(false); // no async needed

  // Login — store only safe user object (token is in httpOnly cookie)
  const login = (userData) => {
    // Strip sensitive fields — never store in localStorage
    const { token: _t, totpSecret: _s, backupCodes: _b, ...safeUser } = userData;
    localStorage.setItem("user", JSON.stringify(safeUser));
    setUser(safeUser);
    setIsAuthenticated(true);

    // Pass identity to Brevo chat widget
    if (window.BrevoConversations) {
      window.BrevoConversations("identify", {
        id:    safeUser.id,
        email: safeUser.systemEmail,
        name:  `${safeUser.firstName} ${safeUser.lastName}`,
        role:  safeUser.role,
      });
    }
  };

  // Logout — call backend to clear cookie, then clear local state
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore network errors on logout
    }
    // Clear Brevo identity
    if (window.BrevoConversations) {
      window.BrevoConversations("reset");
    }
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
  };

  // Permission check
  const hasPermission = (permission) => {
    if (!user?.role) return false;
    const role = user.role.toLowerCase();
    if (role === "superadmin" || role === "superAdmin") return true;
    return rolePermissions[role]?.includes(permission) ?? false;
  };

  // Role check helper
  const hasRole = (...roles) => {
    if (!user?.role) return false;
    return roles.map(r => r.toLowerCase()).includes(user.role.toLowerCase());
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      login,
      logout,
      hasPermission,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export default AuthContext;
