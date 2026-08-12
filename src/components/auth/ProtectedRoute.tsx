import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { getDashboardPathForRole } from "@/lib/dashboardRoutes";

interface ProtectedRouteProps {
  requiredRole?: "admin" | "student" | "innovator" | "startup" | "mentor" | "investor";
  children?: React.ReactNode;
}

export function ProtectedRoute({ requiredRole, children }: ProtectedRouteProps) {
  const { user, role, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user needs onboarding (except for the onboarding page itself)
  // Admins skip onboarding — they manage the platform, not use it as a regular user
  if (profile && !profile.is_onboarded && role !== "admin" && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // Admins should always see the admin dashboard, not the user dashboard
  if (role === "admin" && location.pathname.startsWith("/dashboard")) {
    return <Navigate to="/admin" replace />;
  }

  // Redirect role-specific users from generic /dashboard to their role dashboard
  if (
    role &&
    role !== "admin" &&
    location.pathname === "/dashboard"
  ) {
    const target = getDashboardPathForRole(role);
    if (target !== "/dashboard") {
      return <Navigate to={target} replace />;
    }
  }

  // Check for required role
  if (requiredRole && role !== requiredRole) {
    // Admin can access everything
    if (role === "admin") {
      return children ? <>{children}</> : <Outlet />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
