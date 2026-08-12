import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert investor and pitch coach for CONTRIVER. Your role is to analyze startup pitches from an investor's perspective and provide constructive feedback.

When analyzing a pitch, evaluate:

1. **Clarity Score (1-10)**: How clear and understandable is the pitch?
2. **Persuasiveness Score (1-10)**: How compelling is the pitch to investors?
3. **Structure Analysis**: Does it cover Problem, Solution, Market, Business Model, Team, Ask?
4. **Strengths**: What works well in this pitch?
5. **Weaknesses**: What needs improvement?
6. **Specific Improvements**: Concrete suggestions to make the pitch better
7. **Investor Perspective**: What questions would investors ask? What concerns might they have?
8. **Overall Assessment**: Summary and priority actions

Be constructive but honest. Provide actionable feedback that will genuinely help improve the pitch.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { pitchContent, targetAudience, fundingStage, startupId } = await req.json();
    
    if (!pitchContent) {
      throw new Error("Pitch content is required");
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
Analyze the following startup pitch and provide comprehensive feedback:

**Pitch Content:**
${pitchContent}

**Target Audience:** ${targetAudience || "General investors"}

**Funding Stage:** ${fundingStage || "Not specified"}

Provide feedback as a JSON object with this structure:
{
  "clarityScore": number (1-10),
  "persuasivenessScore": number (1-10),
  "structureAnalysis": {
    "problem": {"present": boolean, "quality": "string"},
    "solution": {"present": boolean, "quality": "string"},
    "market": {"present": boolean, "quality": "string"},
    "businessModel": {"present": boolean, "quality": "string"},
    "team": {"present": boolean, "quality": "string"},
    "ask": {"present": boolean, "quality": "string"}
  },
  "strengths": ["string"],
  "weaknesses": ["string"],
  "specificImprovements": [{"section": "string", "current": "string", "suggestion": "string"}],
  "investorQuestions": ["string"],
  "investorConcerns": ["string"],
  "overallAssessment": "string",
  "priorityActions": ["string"]
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

    // Extract JSON from the response
    let feedback;
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      feedback = { rawContent: textContent };
    }

    // Save to database
    const { data: savedFeedback, error: saveError } = await supabase
      .from("pitch_feedback")
      .insert({
        user_id: user.id,
        startup_id: startupId || null,
        pitch_content: pitchContent,
        target_audience: targetAudience,
        funding_stage: fundingStage,
        feedback: feedback,
        clarity_score: feedback.clarityScore || null,
        persuasiveness_score: feedback.persuasivenessScore || null,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving feedback:", saveError);
    }

    return new Response(
      JSON.stringify({ feedback, feedbackId: savedFeedback?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Pitch Feedback error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
