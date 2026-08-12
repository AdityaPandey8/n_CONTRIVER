import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a strategic business consultant AI for CONTRIVER. Your task is to create comprehensive, deeply detailed business strategies from startup ideas.

Given an idea description, target market, and budget constraints, generate a detailed strategy document. For EVERY section, provide not just surface-level points but also:
- A "rationale" explaining WHY this approach is recommended
- "actionableSteps" with concrete next steps
- "detailedExplanation" with in-depth analysis

Format your response as a structured JSON object. Be specific, actionable, and realistic.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { ideaDescription, targetMarket, budgetConstraints, ideaId } = await req.json();
    
    if (!ideaDescription) {
      throw new Error("Idea description is required");
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

    const userPrompt = `
Create a comprehensive business strategy for the following:

**Idea Description:** ${ideaDescription}
**Target Market:** ${targetMarket || "Not specified - please suggest appropriate target markets"}
**Budget Constraints:** ${budgetConstraints || "Not specified - provide strategies for bootstrap/seed stage"}

Provide the strategy as a JSON object with this structure:
{
  "executiveSummary": {
    "overview": "string",
    "rationale": "string explaining why this is a viable opportunity",
    "keyInsights": ["string"],
    "detailedExplanation": "string with in-depth analysis of the opportunity"
  },
  "marketAnalysis": {
    "marketSize": "string",
    "growthPotential": "string",
    "targetSegments": [{"segment": "string", "description": "string", "size": "string"}],
    "keyTrends": [{"trend": "string", "impact": "string", "relevance": "string"}],
    "rationale": "string explaining the market opportunity",
    "detailedExplanation": "string with deep market analysis"
  },
  "competitivePositioning": {
    "competitors": [{"name": "string", "strengths": ["string"], "weaknesses": ["string"], "marketShare": "string"}],
    "uniqueValueProposition": "string",
    "differentiationStrategy": "string",
    "rationale": "string explaining competitive advantage",
    "actionableSteps": ["string"],
    "detailedExplanation": "string with in-depth competitive analysis"
  },
  "goToMarketStrategy": {
    "launchApproach": "string",
    "marketingChannels": [{"channel": "string", "strategy": "string", "budget": "string", "expectedROI": "string"}],
    "customerAcquisitionTactics": [{"tactic": "string", "description": "string", "timeline": "string"}],
    "partnerships": [{"partner": "string", "value": "string", "approach": "string"}],
    "rationale": "string explaining GTM approach",
    "actionableSteps": ["string"],
    "detailedExplanation": "string with comprehensive GTM analysis"
  },
  "revenueModel": {
    "monetizationStrategy": "string",
    "pricingApproach": "string",
    "revenueStreams": [{"stream": "string", "description": "string", "potential": "string"}],
    "projections": {
      "conservative": "string",
      "moderate": "string",
      "optimistic": "string"
    },
    "rationale": "string explaining revenue approach",
    "detailedExplanation": "string with in-depth revenue analysis"
  },
  "riskAssessment": [{"risk": "string", "impact": "string", "probability": "string", "mitigation": "string", "contingencyPlan": "string"}],
  "actionPlan": [{"week": "string", "tasks": ["string"], "milestone": "string", "metrics": ["string"], "resources": "string"}],
  "resourceRequirements": {
    "team": [{"role": "string", "responsibility": "string", "priority": "string"}],
    "technology": ["string"],
    "budget": {"total": "string", "breakdown": [{"category": "string", "amount": "string"}]},
    "detailedExplanation": "string"
  }
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

    let strategy;
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        strategy = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      strategy = { rawContent: textContent };
    }

    const { data: savedPlan, error: saveError } = await supabase
      .from("strategy_plans")
      .insert({
        user_id: user.id,
        idea_id: ideaId || null,
        title: `Strategy: ${ideaDescription.substring(0, 50)}...`,
        idea_description: ideaDescription,
        target_market: targetMarket,
        budget_constraints: budgetConstraints,
        strategy: strategy,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving strategy:", saveError);
    }

    return new Response(
      JSON.stringify({ strategy, planId: savedPlan?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Strategy Builder error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
