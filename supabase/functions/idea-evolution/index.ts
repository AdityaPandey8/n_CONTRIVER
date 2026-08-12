import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { workspace_id } = await req.json();
    if (!workspace_id) throw new Error("Missing workspace_id");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } },
    );

    const { data: versions, error } = await supabase
      .from("idea_versions")
      .select("*")
      .eq("workspace_id", workspace_id)
      .order("version", { ascending: true });
    if (error) throw error;

    const list = versions || [];
    let comparison: any = null;
    if (list.length >= 2 && LOVABLE_API_KEY) {
      const prev = list[list.length - 2];
      const cur = list[list.length - 1];
      const prompt = `Previous idea (v${prev.version}, score ${prev.score}):\n${JSON.stringify(prev.idea_snapshot)}\n\nCurrent idea (v${cur.version}, score ${cur.score}):\n${JSON.stringify(cur.idea_snapshot)}\n\nList what improved and what weaknesses remain.`;
      try {
        const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "Compare idea versions concisely." },
              { role: "user", content: prompt },
            ],
            tools: [{ type: "function", function: {
              name: "compare", parameters: {
                type: "object",
                properties: {
                  improvements: { type: "array", items: { type: "string" } },
                  weaknesses: { type: "array", items: { type: "string" } },
                },
                required: ["improvements", "weaknesses"],
              },
            }}],
            tool_choice: { type: "function", function: { name: "compare" } },
          }),
        });
        if (r.ok) {
          const j = await r.json();
          const tc = j.choices?.[0]?.message?.tool_calls?.[0];
          if (tc) comparison = JSON.parse(tc.function.arguments);
        }
      } catch (_) { /* non-fatal */ }
    }

    return new Response(JSON.stringify({ versions: list, comparison }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
