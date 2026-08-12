import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

const PROMPTS: Record<string, string> = {
  founder: "Act as a startup coach. Given the founder's metrics, return JSON {health_score:0-100, growth_insights:[], hiring_suggestions:[]}.",
  investor: "Act as an investor analyst. Return JSON {investment_score:0-100, risk:'low'|'medium'|'high', top_deals:[]}.",
  mentor: "Act as a mentor coach. Return JSON {mentee_progress:[], feedback_suggestions:[], weaknesses:[]}.",
  admin: "Act as platform analyst. Return JSON {platform_insights:[], fraud_signals:[], trends:[]}.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { role = "founder", context = {} } = await req.json().catch(() => ({}));
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "Missing LOVABLE_API_KEY" }, 500);

    const authHeader = req.headers.get("Authorization") ?? "";
    const { data: claims } = await admin.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);

    const prompt = `${PROMPTS[role] ?? PROMPTS.founder}\nCONTEXT: ${JSON.stringify(context).slice(0, 4000)}`;
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!r.ok) return json({ error: `gateway ${r.status}` }, r.status);
    const j = await r.json();
    const text = j.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown = {};
    try {
      const m = text.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    } catch { /* */ }
    return json({ role, result: parsed });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});