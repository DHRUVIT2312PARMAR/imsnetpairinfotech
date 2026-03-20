import React from "react";
import { Routes, Route } from "react-router-dom";
import AuthLayout from "./user/AuthLayout";
import Lform from "./components/Login/Lform";
import Rform from "./components/Registration/Rform";
import Fform from "./components/Forgot/Fform";
import Home from "./user/Home/Home";
import Dashboard from "./user/Dash/Dashboard";
import Employees from "./user/Admin_Employess/Employees";
import Attendance from "./user/Admin_Attendance/Attendance";
import Leave from "./user/Admin_leave_page/Leave";
import TaskTimesheet from "./user/Admin_Task_Timesheet/TaskTimesheet";
import Projects from "./user/Admin_Projects/Projects";
import Asset from "./user/Admin_Asset_Page/Asset";
import Reports from "./user/Admin_Reports/Reports";
import Announcements from "./user/Admin_Announcements/Announcements";
import Settings from "./user/Settings/Settings";
import WFH from "./user/WFH/WFH";
import Payroll from "./user/Payroll/Payroll";
import Helpdesk from "./user/Helpdesk/Helpdesk";
import Policies from "./user/Policies/Policies";
import Notifications from "./user/Notifications/Notifications";
import RoleManagement from "./user/RoleManagement/RoleManagement";
import AuditLogs from "./user/AuditLogs/AuditLogs";
import SystemConfig from "./user/SystemConfig/SystemConfig";
import HRManagement from "./user/HRManagement/HRManagement";
import Inventory from "./user/Inventory/Inventory";
import Profile from "./user/Profile/Profile";
import NotFound from "./components/NotFound";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute";

import ChatWrapper from "./components/ChatWrapper";

const App = () => {
  return (
    <>
    <ChatWrapper />
    <Routes>
      {/* Public routes — redirect to /dashboard if already logged in */}
      <Route path="/" element={<PublicRoute><AuthLayout><Lform /></AuthLayout></PublicRoute>} />
      <Route path="/employee/registration" element={<PublicRoute><AuthLayout><Rform /></AuthLayout></PublicRoute>} />
      <Route path="/forgot" element={<PublicRoute><AuthLayout><Fform /></AuthLayout></PublicRoute>} />

      {/* Protected routes — redirect to / if not logged in */}
      <Route element={<ProtectedRoute><Home /></ProtectedRoute>}>
        <Route path="/dashboard"     element={<Dashboard />} />
        {/* All roles */}
        <Route path="/attendance"    element={<Attendance />} />
        <Route path="/leave"         element={<Leave />} />
        <Route path="/helpdesk"      element={<Helpdesk />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings"      element={<Settings />} />
        <Route path="/policies"      element={<Policies />} />
        <Route path="/profile"       element={<Profile />} />
        {/* Employee + Admin + SuperAdmin */}
        <Route path="/tasktimesheet" element={<ProtectedRoute roles={["employee","admin","superadmin"]}><TaskTimesheet /></ProtectedRoute>} />
        {/* HR + Admin + SuperAdmin */}
        <Route path="/employees"     element={<ProtectedRoute roles={["hr","admin","superadmin"]}><Employees /></ProtectedRoute>} />
        <Route path="/hr-management" element={<ProtectedRoute roles={["hr","admin","superadmin"]}><HRManagement /></ProtectedRoute>} />
        <Route path="/wfh"           element={<ProtectedRoute roles={["hr","admin","superadmin"]}><WFH /></ProtectedRoute>} />
        {/* HR + SuperAdmin only (v2.1: Admin removed from projects/assets/payroll) */}
        <Route path="/payroll"       element={<ProtectedRoute roles={["hr","superadmin"]}><Payroll /></ProtectedRoute>} />
        <Route path="/projects"      element={<ProtectedRoute roles={["hr","superadmin"]}><Projects /></ProtectedRoute>} />
        <Route path="/assets"        element={<ProtectedRoute roles={["hr","superadmin"]}><Asset /></ProtectedRoute>} />
        {/* Admin + SuperAdmin */}
        <Route path="/reports"       element={<ProtectedRoute roles={["admin","superadmin"]}><Reports /></ProtectedRoute>} />
        <Route path="/inventory"     element={<ProtectedRoute roles={["admin","superadmin"]}><Inventory /></ProtectedRoute>} />
        <Route path="/role-management" element={<ProtectedRoute roles={["admin","superadmin"]}><RoleManagement /></ProtectedRoute>} />
        {/* SuperAdmin only */}
        <Route path="/audit-logs"           element={<ProtectedRoute roles={["superadmin"]}><AuditLogs /></ProtectedRoute>} />
        <Route path="/system-configuration" element={<ProtectedRoute roles={["superadmin"]}><SystemConfig /></ProtectedRoute>} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
};

export default App;
