import { Navigate, useLocation } from "react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";

interface ProtectedRouteProps {
  children: ReactNode;
  /** If provided, only these roles may pass. Others redirect to their dashboard. */
  allowedRoles?: ("user" | "instructor" | "admin")[];
}

/**
 * Route gate that redirects unauthenticated users to /login and optionally
 * enforces role-based access. Uses TanStack Query for the `me` query, so it
 * re-renders automatically when the user logs in or out.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Not authenticated → remember where they were going so we can bounce back.
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Role check
  if (allowedRoles && !allowedRoles.includes(user.role as any)) {
    if (user.role === "instructor") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
