
import { Navigate } from "react-router-dom";
import {
  getAuthToken,
  getCurrentSession,
} from "../utils/authStorage";

const ADMIN_ROLES = [
  "admin",
  "administrator",
  "hr",
  "hr admin",
  "hr super admin",
  "superadmin",
];

export default function RoleBasedRoute({
  requiredRole,
  children,
}) {
  const session = getCurrentSession();

  let user = session?.user;

  if (!user) {
    try {
      const savedUser =
        localStorage.getItem("user") ||
        sessionStorage.getItem("user");

      user = savedUser ? JSON.parse(savedUser) : null;
    } catch {
      user = null;
    }
  }

  const token = getAuthToken();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = String(user.role || "")
    .trim()
    .toLowerCase();

  const isAdmin = ADMIN_ROLES.includes(role);

  if (requiredRole === "admin" && !isAdmin) {
    return (
      <Navigate to="/employee/dashboard" replace />
    );
  }

  if (requiredRole === "employee" && isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
