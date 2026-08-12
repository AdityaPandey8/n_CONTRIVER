import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: claims } = await admin.auth.getClaims(token);
    if (!claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    // Gather snapshot of metrics
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const [users, newUsers, startups, ideas, validations, usage, risks] = await Promise.all([
      admin.from("profiles").select("*", { count: "exact", head: true }),
      admin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", oneWeekAgo),
      admin.from("startups" as never).select("*", { count: "exact", head: true }),
      admin.from("ideas").select("*", { count: "exact", head: true }),
      admin.from("idea_validations").select("*", { count: "exact", head: true }).gte("created_at", oneWeekAgo),
      admin.from("ai_usage_log").select("cache_hit, latency_ms, tokens_in, tokens_out, created_at").gte("created_at", oneWeekAgo),
      admin.from("risk_analysis").select("level").gte("created_at", oneWeekAgo),
    ]);

    const usageRows = usage.data ?? [];
    const cacheHitRate = usageRows.length
      ? Math.round((usageRows.filter((u) => u.cache_hit).length / usageRows.length) * 100)
      : 0;
    const avgLatency = usageRows.length
      ? Math.round(usageRows.reduce((s, u) => s + (u.latency_ms ?? 0), 0) / usageRows.length)
      : 0;
    const totalTokens = usageRows.reduce((s, u) => s + (u.tokens_in ?? 0) + (u.tokens_out ?? 0), 0);
    const highRiskCount = (risks.data ?? []).filter((r) => r.level === "high").length;

    const metrics = {
      totalUsers: users.count ?? 0,
      newUsers: newUsers.count ?? 0,
      totalStartups: startups.count ?? 0,
      totalIdeas: ideas.count ?? 0,
      validationsThisWeek: validations.count ?? 0,
      aiRequestsThisWeek: usageRows.length,
      cacheHitRate,
      avgLatencyMs: avgLatency,
      totalTokens,
      highRiskCount,
    };

    // Ask Gemini for natural-language insights
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let insights: { title: string; body: string; severity: string }[] = [];
    if (LOVABLE_API_KEY) {
      const prompt = `You are the CONTRIVERS platform analyst. Given these metrics, generate 4 short, actionable insights for the admin. Return STRICT JSON array of {title, body, severity} where severity is one of info|warn|success|danger.
METRICS: ${JSON.stringify(metrics)}`;
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (r.ok) {
        const j = await r.json();
        const text: string = j.choices?.[0]?.message?.content ?? "[]";
        try {
          const match = text.match(/\[[\s\S]*\]/);
          insights = match ? JSON.parse(match[0]) : [];
        } catch { /* ignore */ }
      }
    }

    // Persist insights
    if (insights.length) {
      await admin.from("platform_insights").insert(
        insights.map((i) => ({
          kind: "admin_snapshot",
          title: i.title,
          body: i.body,
          severity: i.severity ?? "info",
          metadata: metrics,
        })),
      );
    }

    return json({ metrics, insights });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});