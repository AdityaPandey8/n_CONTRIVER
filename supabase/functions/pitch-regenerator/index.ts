import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert pitch writer and coach for CONTRIVER. Your task is to take an original startup pitch and the AI feedback it received, then generate an improved version of the pitch that incorporates all the feedback suggestions.

When regenerating:
1. Address every weakness identified in the feedback
2. Preserve and enhance the existing strengths
3. Incorporate all specific improvement suggestions
4. Maintain the founder's authentic voice while improving clarity and persuasiveness
5. Ensure proper pitch structure: Problem → Solution → Market → Business Model → Traction → Team → Ask

Return the improved pitch as clear, well-structured text that the founder can use directly.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { originalPitch, feedback, targetAudience, fundingStage } = await req.json();
    
    if (!originalPitch || !feedback) {
      throw new Error("Original pitch and feedback are required");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const feedbackSummary = typeof feedback === 'string' ? feedback : JSON.stringify(feedback, null, 2);

    const userPrompt = `
Regenerate and improve the following startup pitch based on the feedback received:

**Original Pitch:**
${originalPitch}

**Feedback Received:**
${feedbackSummary}

**Target Audience:** ${targetAudience || "General investors"}
**Funding Stage:** ${fundingStage || "Not specified"}

Please generate an improved pitch that:
1. Addresses all weaknesses identified
2. Incorporates all improvement suggestions
3. Maintains strengths while enhancing them
4. Is structured properly for the target audience
5. Is more clear, persuasive, and investor-ready

Return a JSON object:
{
  "improvedPitch": "string (the full improved pitch text)",
  "changesHighlighted": ["string (key changes made and why)"],
  "tips": ["string (additional tips for delivery)"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI features are experiencing high demand. Please try again in a few moments." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue using AI features." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content;
    
    if (!textContent) {
      throw new Error("No response from AI");
    }

    let result;
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = { improvedPitch: textContent, changesHighlighted: [], tips: [] };
      }
    } catch {
      result = { improvedPitch: textContent, changesHighlighted: [], tips: [] };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Pitch Regenerator error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
