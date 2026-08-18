import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

// Compute matches for a user against mentors / investors / ideas.
// Body: { type: 'mentor' | 'investor' | 'idea', userId?: string, all?: boolean }
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { type = "mentor", userId, all = false, limit = 50 } = await req.json().catch(() => ({}));

    // Load weights
    const { data: settings } = await admin.from("ai_settings").select("match_weights").maybeSingle();
    const w = (settings?.match_weights as Record<string, Record<string, number>>) ?? {};

    // Auth
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: claims } = await admin.auth.getClaims(token);
    const caller = claims?.claims?.sub as string | undefined;
    if (!caller) return json({ error: "Unauthorized" }, 401);

    let isAdmin = false;
    if (all) {
      const { data } = await admin.rpc("has_role", { _user_id: caller, _role: "admin" });
      isAdmin = !!data;
      if (!isAdmin) return json({ error: "Admin only for bulk" }, 403);
    }

    // SECURITY FIX: a non-admin caller could previously pass any userId in
    // single-target mode and this function would compute + write match
    // scores for that other user using the service-role client (bypassing
    // RLS). Only admins may target someone other than themselves.
    let targetUserId = caller;
    if (!all && userId && userId !== caller) {
      if (!isAdmin) {
        const { data } = await admin.rpc("has_role", { _user_id: caller, _role: "admin" });
        isAdmin = !!data;
      }
      if (!isAdmin) {
        return json({ error: "Forbidden: cannot compute matches for another user" }, 403);
      }
      targetUserId = userId;
    }

    const targetUsers = all
      ? (await admin.from("profiles").select("id").limit(200)).data ?? []
      : [{ id: targetUserId }];

    let processed = 0;
    for (const u of targetUsers) {
      const profileQ = await admin.from("profiles").select("*").eq("id", u.id).maybeSingle();
      const profile = profileQ.data;
      if (!profile) continue;

      if (type === "mentor") {
        const { data: mentors } = await admin.from("mentors").select("*").eq("is_verified", true).limit(100);
        const skillW = (w.mentor?.skill ?? 50) / 100;
        const domainW = (w.mentor?.domain ?? 30) / 100;
        const expW = (w.mentor?.experience ?? 20) / 100;
        for (const m of mentors ?? []) {
          const skill = scoreOverlap(profile.skills ?? [], m.expertise ?? []);
          const domain = scoreOverlap(profile.interests ?? [], m.expertise ?? []);
          const exp = Math.min(100, ((m.years_experience ?? 0) / 15) * 100);
          const score = Math.round(skill * skillW + domain * domainW + exp * expW);
          await upsertMatch(admin, u.id, m.id, "mentor", score, { skill, domain, exp });
        }
      } else if (type === "investor") {
        const { data: investors } = await admin.from("investors").select("*").limit(100);
        const indW = (w.investor?.industry ?? 50) / 100;
        const stageW = (w.investor?.stage ?? 30) / 100;
        const fundW = (w.investor?.funding ?? 20) / 100;
        for (const inv of investors ?? []) {
          const industry = scoreOverlap(profile.interests ?? [], inv.focus_domains ?? []);
          const stage = (inv.stage_preference ?? []).length ? 70 : 40;
          const funding = inv.ticket_size_max ? 80 : 50;
          const score = Math.round(industry * indW + stage * stageW + funding * fundW);
          await upsertMatch(admin, u.id, inv.id, "investor", score, { industry, stage, funding });
        }
      } else if (type === "idea") {
        const { data: ideas } = await admin.from("ideas").select("id,title,description,domain").eq("is_published", true).limit(100);
        for (const idea of ideas ?? []) {
          const text = `${idea.title} ${idea.description}`.toLowerCase();
          const overlap = ((profile.interests ?? []) as string[]).filter((i) => text.includes(i.toLowerCase())).length;
          const score = Math.min(100, overlap * 25 + 30);
          await upsertMatch(admin, u.id, idea.id, "idea", score, { overlap });
        }
      }
      processed++;
    }
    return json({ processed, type });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function scoreOverlap(a: string[], b: string[]): number {
  if (!a?.length || !b?.length) return 30;
  const setB = new Set(b.map((x) => x.toLowerCase()));
  const hits = a.filter((x) => setB.has(x.toLowerCase())).length;
  return Math.min(100, Math.round((hits / Math.max(a.length, 1)) * 100) + 20);
}

async function upsertMatch(admin: ReturnType<typeof createClient>, userId: string, targetId: string, type: string, score: number, breakdown: Record<string, number>) {
  await admin.from("match_scores").upsert(
    { user_id: userId, target_id: targetId, target_type: type, score, breakdown, computed_at: new Date().toISOString() },
    { onConflict: "user_id,target_id,target_type" } as never,
  );
}
