import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a creative innovation consultant for CONTRIVER, specializing in generating unique and viable startup ideas. 

When generating ideas:
1. Focus on real problems that need solutions
2. Consider current technology trends and market opportunities
3. Think about scalability and business viability
4. Generate ideas that are innovative but achievable
5. Cover diverse approaches within the given domain
6. When budget constraints are provided, tailor ideas to be feasible within that budget

For each idea, provide:
- A catchy title
- A memorable tagline
- Clear problem-solution fit
- Target market identification
- Budget-aware implementation approach
- Potential challenges
- Initial validation steps

Be creative, practical, and inspiring. Generate ideas that could genuinely become successful startups.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { domain, problemArea, constraints, budgetConstraints, count = 3, mode, idea } = await req.json();
    
    const authHeader = req.headers.get("Authorization");

    // Budget estimation mode
    if (mode === "estimate_budget") {
      if (!idea) throw new Error("Idea details are required for budget estimation");

      const budgetPrompt = `
Analyze the following startup idea and provide a detailed budget estimate to build and launch the MVP.

**Idea Title:** ${idea.title}
**Description:** ${idea.description || "N/A"}
**Problem:** ${idea.problem_statement || idea.problem || "N/A"}
**Solution:** ${idea.solution || "N/A"}
**Target Market:** ${idea.target_market || idea.targetMarket || "N/A"}
**Domain:** ${idea.domain || "General"}

Provide a comprehensive budget estimate as a JSON object with this exact structure:
{
  "totalEstimate": "string (e.g., '$15,000 - $25,000')",
  "breakdown": [
    { "category": "string", "estimate": "string", "details": "string (1-2 sentence explanation)" }
  ],
  "assumptions": ["string (key assumptions made)"],
  "timeline": "string (estimated time to MVP)",
  "costSavingTips": ["string (ways to reduce costs)"]
}

Include categories like: Development, Design/UX, Infrastructure/Hosting, Marketing/Launch, Legal/Compliance, Team/Freelancers, Tools/Subscriptions, Contingency. Only include relevant categories.
Be realistic and practical. Consider both bootstrapped and funded scenarios in your estimates.`;

      const budgetResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a startup financial advisor. Provide realistic, detailed budget estimates for startup ideas. Always respond with valid JSON." },
            { role: "user", content: budgetPrompt }
          ],
        }),
      });

      if (!budgetResponse.ok) {
        const errorText = await budgetResponse.text();
        console.error("Budget estimation error:", budgetResponse.status, errorText);
        if (budgetResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "AI features are experiencing high demand. Please try again in a few moments." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`AI Gateway error: ${budgetResponse.status}`);
      }

      const budgetData = await budgetResponse.json();
      const budgetText = budgetData.choices?.[0]?.message?.content;
      
      if (!budgetText) throw new Error("No response from AI");

      let budgetResult;
      try {
        const jsonMatch = budgetText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          budgetResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found");
        }
      } catch {
        budgetResult = { totalEstimate: "Unable to parse", breakdown: [], assumptions: [], timeline: "Unknown", rawContent: budgetText };
      }

      return new Response(
        JSON.stringify(budgetResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!domain) {
      throw new Error("Domain/industry is required");
    }

    const budgetInfo = budgetConstraints || constraints || "";
    
    const userPrompt = `
Generate ${count} innovative startup ideas for the following:

**Domain/Industry:** ${domain}

**Problem Area (if specified):** ${problemArea || "Open - explore various problems in this domain"}

**Budget Constraints:** ${budgetInfo || "None specified"}

${budgetInfo ? `IMPORTANT: All ideas must be feasible within the budget constraint of "${budgetInfo}". Include estimated startup costs, suggest cost-effective approaches, and highlight which ideas offer the best ROI for this budget level.` : ""}

Provide ideas as a JSON object with this structure:
{
  "ideas": [
    {
      "title": "string",
      "tagline": "string (catchy one-liner)",
      "problem": "string (the problem being solved)",
      "solution": "string (how this idea solves it)",
      "targetMarket": "string (who would use this)",
      "marketSize": "string (estimated market opportunity)",
      "uniqueAngle": "string (what makes this different)",
      "estimatedBudget": "string (estimated cost to launch MVP)",
      "budgetBreakdown": "string (brief breakdown of key costs)",
      "challenges": ["string (potential obstacles)"],
      "validationSteps": ["string (how to validate this idea)"],
      "techStack": ["string (suggested technologies)"],
      "revenueModel": "string (how it could make money)"
    }
  ]
}

Make each idea unique, creative, and practically viable. Focus on ideas that solve real problems and have clear paths to validation.`;

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
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      result = { ideas: [], rawContent: textContent };
    }

    if (authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.from("ai_chat_sessions").insert({
          user_id: user.id,
          session_type: "idea",
          title: `Ideas for ${domain}`,
          messages: [
            { role: "user", content: `Generate ideas for ${domain}` },
            { role: "assistant", content: JSON.stringify(result) }
          ]
        });
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Idea Generator error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
