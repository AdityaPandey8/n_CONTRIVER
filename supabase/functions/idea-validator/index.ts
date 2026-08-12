import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---------- Helpers ----------
async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalize(text: string): string {
  return (text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function detectDomain(text: string): string {
  const t = text.toLowerCase();
  if (/\b(ai|ml|llm|gpt|gemini|model)\b/.test(t)) return "AI";
  if (/\b(edu|edtech|learn|student|course)\b/.test(t)) return "EdTech";
  if (/\b(fin|payment|bank|invest|crypto)\b/.test(t)) return "FinTech";
  if (/\b(health|medical|clinic|patient)\b/.test(t)) return "HealthTech";
  if (/\b(climate|green|carbon|sustain)\b/.test(t)) return "ClimateTech";
  return "General";
}

function computeCVM(b: any) {
  const demand = Number(b.market_demand ?? b.demand ?? 0);
  const feas = Number(b.feasibility ?? 0);
  const innov = Number(b.innovation ?? 0);
  const scale = Number(b.scalability ?? b.competition ?? 0);
  const score = Math.round(0.4 * demand + 0.3 * feas + 0.2 * innov + 0.1 * scale);
  let category = "Weak";
  if (score >= 70) category = "Strong";
  else if (score >= 45) category = "Moderate";
  return { score, category, breakdown: { market_demand: demand, feasibility: feas, innovation: innov, scalability: scale } };
}

function computeRisk(breakdown: any, aiRisks: string[]) {
  const flags: string[] = [];
  if (breakdown.market_demand < 50) flags.push("Low market demand");
  if (breakdown.feasibility < 60) flags.push("Feasibility concerns");
  if (breakdown.scalability < 50) flags.push("Limited scalability");
  if (breakdown.innovation < 40) flags.push("Weak differentiation");
  const total = flags.length + (aiRisks?.length ?? 0);
  let level = "low";
  if (total >= 4) level = "high";
  else if (total >= 2) level = "medium";
  return { level, flags };
}

function computeClarity(text: string): number {
  if (!text) return 0;
  const len = text.length;
  if (len < 40) return 30;
  if (len < 120) return 55;
  if (len < 400) return 80;
  return 90;
}

function computeCompleteness(details: any): number {
  const sections = ["problem", "solution", "market", "users", "business_model"];
  const present = sections.filter((s) => details && details[s]).length;
  return Math.round((present / sections.length) * 100);
}

async function callGemini(payload: any, apiKey: string) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`gateway:${resp.status}:${t}`);
  }
  return await resp.json();
}

function buildScorePayload(workspaceName: string, summary: string) {
  return {
    model: "google/gemini-3-flash-preview",
    messages: [
      { role: "system", content: "You are a startup validation expert. Score 0-100." },
      { role: "user", content: `Idea: ${workspaceName}\n\nDetails:\n${summary || "No details."}` },
    ],
    tools: [{
      type: "function",
      function: {
        name: "validate_idea",
        description: "Return idea validation",
        parameters: {
          type: "object",
          properties: {
            market_demand: { type: "integer", minimum: 0, maximum: 100 },
            feasibility: { type: "integer", minimum: 0, maximum: 100 },
            innovation: { type: "integer", minimum: 0, maximum: 100 },
            scalability: { type: "integer", minimum: 0, maximum: 100 },
            suggestions: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
          },
          required: ["market_demand", "feasibility", "innovation", "scalability", "suggestions", "risks"],
        },
      },
    }],
    tool_choice: { type: "function", function: { name: "validate_idea" } },
  };
}

function parseTool(result: any) {
  const tc = result.choices?.[0]?.message?.tool_calls?.[0];
  if (tc) return JSON.parse(tc.function.arguments);
  const c = result.choices?.[0]?.message?.content || "{}";
  return JSON.parse(c.replace(/```json\n?/g, "").replace(/```/g, ""));
}

// ---------- Handler ----------
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { workspace_name, details, workspace_id } = await req.json();
    if (!workspace_name) throw new Error("Missing workspace_name");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();

    const detailsSummary = Object.entries(details || {})
      .map(([s, d]) => `${s}: ${JSON.stringify(d)}`).join("\n");

    const normalizedKey = normalize(`${workspace_name}|${detailsSummary}`);
    const cacheKey = await sha256(`validate|${normalizedKey}`);
    const domain = detectDomain(`${workspace_name} ${detailsSummary}`);

    // Cache check
    const { data: cached } = await userClient
      .from("ai_cache")
      .select("output, expires_at")
      .eq("key", cacheKey)
      .maybeSingle();

    let parsed: any;
    let fromCache = false;
    if (cached && new Date(cached.expires_at) > new Date()) {
      parsed = cached.output;
      fromCache = true;
    } else {
      const payload = buildScorePayload(workspace_name, detailsSummary);
      const r1 = await callGemini(payload, LOVABLE_API_KEY).catch((e) => {
        if (e.message.includes("429")) throw new Response(JSON.stringify({ error: "Rate limit. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (e.message.includes("402")) throw new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw e;
      });
      const a = parseTool(r1);
      // Confidence consistency: run lightweight second pass only on key axes
      const r2 = await callGemini(payload, LOVABLE_API_KEY).catch(() => null);
      const b = r2 ? parseTool(r2) : a;
      const variance =
        Math.abs(a.market_demand - b.market_demand) +
        Math.abs(a.feasibility - b.feasibility) +
        Math.abs(a.innovation - b.innovation) +
        Math.abs(a.scalability - b.scalability);
      const consistency = Math.max(0, 100 - variance); // 0-100
      parsed = { ...a, _consistency: consistency };
      // Cache
      await userClient.from("ai_cache").upsert({
        key: cacheKey, action: "validate", input: { name: workspace_name }, output: parsed, model: "google/gemini-3-flash-preview",
        expires_at: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
      });
    }

    const cvm = computeCVM(parsed);
    const risk = computeRisk(cvm.breakdown, parsed.risks || []);
    const clarity = computeClarity(`${workspace_name} ${detailsSummary}`);
    const completeness = computeCompleteness(details);
    const consistency = parsed._consistency ?? 80;
    const confidence = Math.round(0.4 * consistency + 0.3 * completeness + 0.3 * clarity);

    const response = {
      overall_score: cvm.score,
      category: cvm.category,
      breakdown: cvm.breakdown,
      suggestions: parsed.suggestions || [],
      risks: parsed.risks || [],
      risk_level: risk.level,
      risk_flags: risk.flags,
      confidence,
      confidence_inputs: { consistency, completeness, clarity },
      domain,
      from_cache: fromCache,
    };

    // Persist version + risk + memory if user/workspace provided
    if (user && workspace_id) {
      const { data: prev } = await userClient
        .from("idea_versions")
        .select("version, score")
        .eq("workspace_id", workspace_id)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextVersion = (prev?.version ?? 0) + 1;
      const diff = prev ? { score_delta: cvm.score - prev.score } : {};

      const { data: versionRow } = await userClient.from("idea_versions").insert({
        workspace_id, user_id: user.id, version: nextVersion,
        idea_snapshot: { name: workspace_name, details },
        score: cvm.score, confidence, risk: risk.level,
        breakdown: cvm.breakdown, diff_from_prev: diff,
      }).select("id").single();

      await userClient.from("risk_analysis").insert({
        workspace_id, user_id: user.id, version_id: versionRow?.id,
        risk_level: risk.level, rule_flags: risk.flags, ai_risks: parsed.risks || [],
      });

      await userClient.from("ai_context_memory").upsert({
        user_id: user.id, role: "innovator",
        summary: `Working on "${workspace_name}" in ${domain}`,
        last_stage: "validation", last_score: cvm.score,
        data: { workspace_id }, updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,role" });
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("idea-validator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
