import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { idea } = await req.json();
    if (!idea) throw new Error("Missing idea input");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a startup strategist and innovation consultant. 
Given a rough idea, expand it into deep structured insights.

Return a JSON object with these keys:
- problem_space: array of 3-5 deep insights about the problem
- target_audiences: array of 3-5 potential user segments
- market_opportunities: array of 3-5 market opportunities
- competitor_landscape: array of 3-5 competitor/alternative analysis points
- business_possibilities: array of 3-5 business model ideas
- directions: array of exactly 3 objects, each with "title" and "description" keys representing different ways to build the idea

RULES:
- Be insightful, not generic
- Think like a founder
- Each insight should be actionable and specific
- Return ONLY valid JSON, no markdown`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Idea: ${idea}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "explore_idea",
              description: "Return structured idea exploration insights",
              parameters: {
                type: "object",
                properties: {
                  problem_space: { type: "array", items: { type: "string" } },
                  target_audiences: { type: "array", items: { type: "string" } },
                  market_opportunities: { type: "array", items: { type: "string" } },
                  competitor_landscape: { type: "array", items: { type: "string" } },
                  business_possibilities: { type: "array", items: { type: "string" } },
                  directions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["title", "description"],
                    },
                  },
                },
                required: ["problem_space", "target_audiences", "market_opportunities", "competitor_landscape", "business_possibilities", "directions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "explore_idea" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits required. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    let parsed;
    if (toolCall) {
      parsed = JSON.parse(toolCall.function.arguments);
    } else {
      const content = result.choices?.[0]?.message?.content || "{}";
      parsed = JSON.parse(content.replace(/```json\n?/g, "").replace(/```/g, ""));
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("idea-explorer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
