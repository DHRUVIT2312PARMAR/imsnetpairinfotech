import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Shows a spinner while auth state is loading
const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <svg className="animate-spin h-10 w-10 text-blue-600" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

/**
 * ProtectedRoute — only accessible when authenticated.
 * Redirects to "/" if not logged in.
 * Optionally restrict by roles: <ProtectedRoute roles={["admin","hr"]}>
 */
export const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  // Role restriction (optional)
  if (roles && user?.role) {
    const allowed = roles.map(r => r.toLowerCase());
    if (!allowed.includes(user.role.toLowerCase())) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

/**
 * PublicRoute — only accessible when NOT authenticated.
 * Redirects to "/dashboard" if already logged in.
 */
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Spinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return children;
};
