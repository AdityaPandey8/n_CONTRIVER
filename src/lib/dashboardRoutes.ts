export type AppRole = "admin" | "student" | "innovator" | "startup" | "mentor" | "investor";

/**
 * Returns the home dashboard path for a given role.
 * Student & Innovator share the existing UserDashboard at `/dashboard`.
 */
export function getDashboardPathForRole(role: AppRole | null | undefined): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "investor":
      return "/dashboard/investor";
    case "mentor":
      return "/dashboard/mentor";
    case "startup":
      return "/dashboard/founder";
    case "student":
    case "innovator":
    default:
      return "/dashboard";
  }
}

/** Routes that count as the role's "home" dashboard for redirect logic. */
export const ROLE_DASHBOARD_PATHS = [
  "/dashboard",
  "/dashboard/investor",
  "/dashboard/mentor",
  "/dashboard/founder",
] as const;