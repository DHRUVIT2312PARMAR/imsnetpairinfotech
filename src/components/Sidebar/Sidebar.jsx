import React, { useState, useEffect } from "react";
import Header from "../Header";
import "remixicon/fonts/remixicon.css";
import Sidedata from "./Sidedata";
import { useAuth } from "../../context/AuthContext";

// Full nav items list — v2.1 role assignments
// roles: null = visible to all authenticated users
const allNavItems = [
  // All roles
  { navpath: "dashboard",            icon: "ri-dashboard-line",              data: "Dashboard",        roles: null },
  { navpath: "attendance",           icon: "ri-calendar-check-line",         data: "Attendance",       roles: null },
  { navpath: "leave",                icon: "ri-survey-line",                 data: "Leave",            roles: null },
  { navpath: "helpdesk",             icon: "ri-customer-service-line",       data: "Helpdesk",         roles: null },
  { navpath: "announcements",        icon: "ri-megaphone-line",              data: "Announcements",    roles: null },
  { navpath: "settings",             icon: "ri-equalizer-line",              data: "Settings",         roles: null },
  { navpath: "policies",             icon: "ri-file-list-line",              data: "Policies",         roles: null },
  // Employee + Admin + SuperAdmin (HR does NOT have tasks-timesheet)
  { navpath: "tasktimesheet",        icon: "ri-task-line",                   data: "Tasks-Timesheet",  roles: ["employee","admin","superadmin"] },
  // HR + Admin + SuperAdmin
  { navpath: "employees",            icon: "ri-user-2-line",                 data: "Employees",        roles: ["hr","admin","superadmin"] },
  { navpath: "hr-management",        icon: "ri-user-settings-line",          data: "HR Management",    roles: ["hr","admin","superadmin"] },
  { navpath: "wfh",                  icon: "ri-home-office-line",            data: "WFH Records",      roles: ["hr","admin","superadmin"] },
  // HR + SuperAdmin only (v2.1: Admin removed)
  { navpath: "payroll",              icon: "ri-money-dollar-circle-line",    data: "Payroll",          roles: ["hr","superadmin"] },
  { navpath: "projects",             icon: "ri-folder-line",                 data: "Projects",         roles: ["hr","superadmin"] },
  { navpath: "assets",               icon: "ri-archive-stack-line",          data: "Assets",           roles: ["hr","superadmin"] },
  // Admin + SuperAdmin
  { navpath: "reports",              icon: "ri-bar-chart-line",              data: "Reports",          roles: ["admin","superadmin"] },
  { navpath: "inventory",            icon: "ri-store-line",                  data: "Inventory",        roles: ["admin","superadmin"] },
  { navpath: "role-management",      icon: "ri-shield-user-line",            data: "Role Management",  roles: ["admin","superadmin"] },
  // SuperAdmin only
  { navpath: "audit-logs",           icon: "ri-file-history-line",           data: "Audit Logs",       roles: ["superadmin"] },
  { navpath: "system-configuration", icon: "ri-settings-4-line",             data: "System Config",    roles: ["superadmin"] },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() || "employee";

  // Auto-collapse on mobile
  useEffect(() => {
    const check = () => {
      if (window.innerWidth < 768) setCollapsed(true);
      else setCollapsed(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Filter nav items by role
  const filteredNav = allNavItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });

  return (
    <div className="flex">
      {/* Sidebar panel */}
      <div
        className={`min-h-screen bg-white border-r border-gray-300 transition-all duration-300 flex-shrink-0
          ${collapsed ? "w-20" : "w-75"}`}
      >
        {/* Logo + toggle */}
        <div className="h-15 flex items-center justify-between border-b border-gray-300 px-2 relative">
          {!collapsed && (
            <img
              src="src/assets/imgs/image-removebg-preview.png"
              className="h-10 px-1"
              alt="logo"
            />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-1 rounded-lg hover:bg-gray-200 text-2xl"
            aria-label="Toggle sidebar"
          >
            <i className={collapsed ? "ri-menu-unfold-line" : "ri-layout-left-line"}></i>
          </button>
        </div>

        {/* Nav items */}
        <div className="overflow-y-auto h-[calc(100vh-60px)]">
          <div className="p-2 flex flex-col gap-1">
            {filteredNav.map((item, ind) => (
              <Sidedata
                key={ind}
                navpath={item.navpath}
                icon={item.icon}
                data={item.data}
                coll={collapsed}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <Header />
    </div>
  );
};

export default Sidebar;
