import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BrevoChat from "./BrevoChat";

// Pages where chat is hidden regardless of role
const HIDDEN_PAGES = [
  "/",
  "/employee/registration",
  "/forgot",
  "/role-management",
  "/audit-logs",
  "/system-configuration",
  "/payroll",
];

const ChatWrapper = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Only show for employee and hr
  const showForRole = ["employee", "hr"].includes(user?.role);
  const onHiddenPage = HIDDEN_PAGES.includes(location.pathname);

  return <BrevoChat visible={showForRole && !onHiddenPage} />;
};

export default ChatWrapper;
