import React from "react";
import { useAuth } from "../../context/AuthContext";
import EmployeeAttendance from "./EmployeeAttendance";
import HRAttendance from "./HRAttendance";

const Attendance = () => {
  const { user } = useAuth();
  const role = (user?.role || "employee").toLowerCase().trim();

  if (role === "employee") return <EmployeeAttendance />;
  return <HRAttendance />;
};

export default Attendance;
