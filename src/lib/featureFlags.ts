// Phase 2 (Architecture Simplification) feature flags.
//
// Investor and Startup/Founder dashboards are frozen for V1 - all code,
// routes, components, and data stay intact; they're just not reachable
// through normal navigation or onboarding. To un-freeze a role later,
// remove it from FROZEN_ROLES (and update dashboardRoutes.ts /
// DashboardSidebar.tsx to route/nav to it again) - nothing needs to be
// rebuilt.

import type { AppRole } from "./dashboardRoutes";

/** Roles that exist in the DB/enum but are not selectable or reachable in V1. */
export const FROZEN_ROLES: readonly AppRole[] = ["investor", "startup"] as const;

export function isFrozenRole(role: AppRole | null | undefined): boolean {
  return !!role && FROZEN_ROLES.includes(role);
}

/**
 * Path prefixes that belong to a frozen dashboard/feature. Matched routes
 * render the ComingSoon page instead of their real component - the real
 * component and its route registration are untouched.
 */
export const FROZEN_ROUTE_PREFIXES = [
  "/dashboard/investor", // Investor Dashboard + Discover/Watchlist/Pipeline/Portfolio/Insights
  "/dashboard/founder", // Founder Dashboard + Fundraising/Team/Analytics/Tasks
  "/dashboard/investor-connect", // Investor Connect marketplace (frozen per product decision)
  "/dashboard/startups", // Startups listing - frozen for Student/Innovator only (Admin keeps /admin/startups)
  "/dashboard/startup", // Startup detail page /dashboard/startup/:startupId - same freeze
  "/dashboard/jobs", // Jobs listing - frozen for Student/Innovator only (Admin keeps /admin/jobs)
  "/dashboard/job", // Job detail page /dashboard/job/:jobId - same freeze
] as const;

export function isFrozenPath(pathname: string): boolean {
  return FROZEN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}
