import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const limited = await checkRateLimit(admin, userId, "pitch-deck-generator", 20);
    if (limited) return limited;

    const { ideaName, oneLiner, domain, stage, details, validationScore, sourceText, style, mode } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const investorSlides = mode === "investor" ? `
    Also include these additional slides:
    - "TAM/SAM/SOM" slide with market sizing estimates
    - "Financial Projections" slide with revenue forecasts for 3 years
    ` : "";

    const systemPrompt = `You are an expert pitch deck creator. Generate a professional pitch deck with structured slides.
    
Each slide must have: "slide_type", "title", "content" (main text/bullet points as string), "notes" (speaker notes).

Generate these slides in order:
1. "title" - Company name, tagline, and founding info
2. "problem" - The problem being solved (3-4 pain points)
3. "solution" - How the product solves it (key features)
4. "market" - Market opportunity and size
5. "product" - Product overview and key features
6. "business_model" - How the company makes money
7. "competitors" - Competitive landscape and differentiation
8. "traction" - Current traction, metrics, milestones
9. "roadmap" - Product roadmap and timeline
10. "team" - Team overview
11. "conclusion" - Call to action and ask
${investorSlides}

Style: ${style || "minimal"}. Make content compelling and concise.
Return a JSON object with a "slides" array.`;

    const userPrompt = `Create a pitch deck for:
Idea: ${ideaName}
One-liner: ${oneLiner || "N/A"}
Domain: ${domain}
Stage: ${stage}
${details ? `Details: ${JSON.stringify(details)}` : ""}
${validationScore ? `Validation Score: ${validationScore}/100` : ""}
${sourceText ? `Additional Context: ${sourceText}` : ""}`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_pitch_deck",
            description: "Generate structured pitch deck slides",
            parameters: {
              type: "object",
              properties: {
                slides: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      slide_type: { type: "string" },
                      title: { type: "string" },
                      content: { type: "string" },
                      notes: { type: "string" },
                    },
                    required: ["slide_type", "title", "content", "notes"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["slides"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_pitch_deck" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", status, t);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    let slides;
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      slides = parsed.slides;
    } else {
      throw new Error("No structured output returned");
    }

    return new Response(JSON.stringify({ slides }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pitch-deck-generator error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
