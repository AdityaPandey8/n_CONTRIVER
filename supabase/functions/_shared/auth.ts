// Shared auth helpers for edge functions.
//
// Rule: NEVER trust a client-supplied userId/workspaceId for identity.
// Always derive the caller's identity from their verified JWT, and check
// resource ownership against the database before acting on a resource id.

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, json } from "./cors.ts";

export type AuthResult = {
  userId: string;
  admin: SupabaseClient; // service-role client, use ONLY after this auth check
};

/**
 * Verifies the request carries a valid Supabase JWT and returns the
 * authenticated user's id (from the token, never from the request body).
 * Returns a Response to send back immediately if auth fails.
 */
export async function requireUser(
  req: Request,
): Promise<AuthResult | Response> {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return json({ error: "Unauthorized" }, 401);

  const { data: claims } = await admin.auth.getClaims(token);
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return json({ error: "Unauthorized" }, 401);

  return { userId, admin };
}

/**
 * Same as requireUser, but also requires the caller to hold the given role
 * (checked via the has_role() SECURITY DEFINER function, never via a
 * client-supplied role/flag).
 */
export async function requireRole(
  req: Request,
  role: string,
): Promise<AuthResult | Response> {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const { data: hasRole } = await auth.admin.rpc("has_role", {
    _user_id: auth.userId,
    _role: role,
  });
  if (!hasRole) return json({ error: "Forbidden" }, 403);

  return auth;
}

/** Type guard so call sites can `if (auth instanceof Response) return auth;` */
export function isErrorResponse(x: unknown): x is Response {
  return x instanceof Response;
}

/**
 * Simple per-user sliding-window rate limit backed by ai_usage_log.
 * Returns a 429 Response if the user has exceeded `maxPerHour` calls to
 * `module` in the last hour, otherwise null (caller may proceed).
 * This is a cheap deterrent against a single compromised/malicious account
 * hammering the paid AI gateway — not a substitute for infra-level limits
 * at real scale.
 */
export async function checkRateLimit(
  admin: SupabaseClient,
  userId: string,
  module: string,
  maxPerHour = 20,
): Promise<Response | null> {
  const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
  const { count } = await admin
    .from("ai_usage_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("module", module)
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= maxPerHour) {
    return json({ error: "Rate limit exceeded. Please try again later." }, 429);
  }
  return null;
}

/** Best-effort usage log write; never throws (logging must not break the request). */
export async function logUsage(
  admin: SupabaseClient,
  userId: string,
  module: string,
  extra: Record<string, unknown> = {},
): Promise<void> {
  try {
    await admin.from("ai_usage_log").insert({ user_id: userId, module, ...extra });
  } catch {
    // non-fatal
  }
}

export { corsHeaders, json };
