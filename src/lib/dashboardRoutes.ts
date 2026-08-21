export type AppRole = "admin" | "student" | "innovator" | "startup" | "mentor" | "investor";

/**
 * Returns the home dashboard path for a given role.
 * Student & Innovator share the existing UserDashboard at `/dashboard`.
 *
 * Investor and Startup are frozen for V1 (see src/lib/featureFlags.ts) —
 * any existing user who already holds one of these roles is sent to the
 * main workspace instead of their (now-frozen) dedicated dashboard. This
 * only matters for pre-existing accounts; new users can no longer select
 * these roles during onboarding.
 */
export function getDashboardPathForRole(role: AppRole | null | undefined): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "mentor":
      return "/dashboard/mentor";
    case "investor":
    case "startup":
    case "student":
    case "innovator":
    default:
      return "/dashboard";
  }
}

/** Routes that count as the role's "home" dashboard for redirect logic. */
export const ROLE_DASHBOARD_PATHS = [
  "/dashboard",
  "/dashboard/mentor",
] as const;