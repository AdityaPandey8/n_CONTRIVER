import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireUser, checkRateLimit } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
    const auth = await requireUser(req);
    if (auth instanceof Response) return auth;
    const { userId, admin } = auth;
    const limited = await checkRateLimit(admin, userId, "investor-matcher", 30);
    if (limited) return limited;

    const { domain, stage, validationScore } = await req.json();

    const supabase = admin;

    const { data: investors, error } = await supabase.from("investors").select("*");
    if (error) throw error;

    const matches = (investors || []).map((inv: any) => {
      let score = 0;
      
      // Domain overlap (40 points max)
      const domainLower = (domain || "").toLowerCase();
      const domainMatch = (inv.focus_domains || []).some((d: string) => 
        domainLower.includes(d.toLowerCase()) || d.toLowerCase().includes(domainLower)
      );
      if (domainMatch) score += 40;
      else score += 10; // partial

      // Stage match (30 points max)
      const stageMatch = (inv.stage_preference || []).includes(stage);
      if (stageMatch) score += 30;
      else score += 5;

      // Validation score bonus (30 points max)
      if (validationScore) {
        score += Math.round((validationScore / 100) * 30);
      } else {
        score += 10;
      }

      return { ...inv, match_score: Math.min(score, 100) };
    });

    matches.sort((a: any, b: any) => b.match_score - a.match_score);

    return new Response(JSON.stringify({ matches }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("investor-matcher error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
