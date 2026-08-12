import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MODULE_PROMPTS: Record<string, string> = {
  mentor: `You are CONTRIVERS AI Mentor — an expert startup advisor. Help founders validate ideas, find product-market fit, build MVPs, raise funding, and grow. Be concise, actionable, and supportive. Use markdown.`,
  explorer: `You are CONTRIVERS Idea Explorer. Analyze the user's existing idea: surface weaknesses, find direct/indirect competitors, suggest differentiation, refine the value proposition. Do NOT invent brand new ideas — refine what the user has. Use markdown with clear sections.`,
  strategy: `You are CONTRIVERS Strategy Builder. Produce structured business strategy: Business Model, GTM Strategy, Pricing, Revenue Model, Growth Plan. Use markdown headings and bullet points.`,
  market: `You are CONTRIVERS Market Analyst. Produce rigorous market analysis including TAM / SAM / SOM (with reasoning), market trends, competitive landscape, and industry opportunities. Use markdown tables when useful.`,
  pitch_feedback: `You are CONTRIVERS Pitch Coach. Review the user's pitch (text, deck summary, or uploaded content). Score it (0-100) on Clarity, Persuasiveness, Storytelling, and Investor-readiness. List specific weaknesses and concrete improvements. Use markdown.`,
  ppt: `You are CONTRIVERS PPT Creator. Help the user outline, write, and refine investor / hackathon / business pitch decks. When asked, output slide-by-slide content (Title, Body, Speaker notes) in markdown so it can be exported later.`,
  ideas: `You are CONTRIVERS Ideas Hub. Generate completely NEW startup, hackathon, and innovation ideas based on the user's input (domain, interest, constraints, trends). Provide a one-liner, target market, why-now, and a 3-step build plan for each idea. Use markdown.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const { messages, moduleType, workspaceContext, workspaceId, userId, conversationId } =
      await req.json();
    if (!Array.isArray(messages)) throw new Error("messages required");

    const basePrompt =
      MODULE_PROMPTS[moduleType as string] ?? MODULE_PROMPTS.mentor;

    // Admin service client for cache + usage logging
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Build unified workspace knowledge (derived, always fresh)
    let liveContext = workspaceContext;
    let workspaceCacheVersion = 0;
    if (workspaceId) {
      const knowledge = await buildWorkspaceKnowledge(admin, workspaceId);
      liveContext = liveContext ?? knowledge.data;
      workspaceCacheVersion = knowledge.version;
    }

    const contextBlock = liveContext
      ? `\n\nWORKSPACE KNOWLEDGE (single source of truth for this idea):\n\`\`\`json\n${JSON.stringify(
          liveContext,
        ).slice(0, 8000)}\n\`\`\`\nReference this when answering; do not ask the user to repeat anything already present here.`
      : "";

    // Load persistent user memory (cross-chat profile)
    let memoryBlock = "";
    let memoryRow: {
      memory_summary?: string | null;
      role?: string | null;
      startup_stage?: string | null;
      preferred_industry?: string | null;
      startup_name?: string | null;
      startup_description?: string | null;
      industry?: string | null;
      target_users?: string | null;
      goals?: string[] | null;
      preferred_ai_style?: string | null;
      updated_at?: string;
    } | null = null;
    if (userId) {
      const { data } = await admin
        .from("user_ai_memory")
        .select(
          "memory_summary, role, startup_stage, preferred_industry, startup_name, startup_description, industry, target_users, goals, preferred_ai_style, updated_at",
        )
        .eq("user_id", userId)
        .maybeSingle();
      memoryRow = data ?? null;
      const lines = [
        memoryRow?.startup_name && `Startup: ${memoryRow.startup_name}`,
        memoryRow?.startup_description && `About: ${memoryRow.startup_description}`,
        memoryRow?.industry && `Industry: ${memoryRow.industry}`,
        memoryRow?.startup_stage && `Stage: ${memoryRow.startup_stage}`,
        memoryRow?.target_users && `Target users: ${memoryRow.target_users}`,
        memoryRow?.goals && memoryRow.goals.length > 0 && `Goals: ${memoryRow.goals.join(", ")}`,
        memoryRow?.role && `Role: ${memoryRow.role}`,
        memoryRow?.preferred_ai_style && `Preferred AI style: ${memoryRow.preferred_ai_style}`,
        memoryRow?.memory_summary && `Summary: ${memoryRow.memory_summary}`,
      ].filter(Boolean);
      if (lines.length > 0) {
        memoryBlock = `\n\nUSER PROFILE (persistent across all chats — never ask the user to repeat any of this):\n${lines.join("\n")}`;
      }
    }

    // Smart context window — keep last 20 turns
    const trimmedMessages = messages.slice(-20);

    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user")?.content ?? "";
    const cacheKey = await sha256(
      `${moduleType}|${workspaceId ?? ""}|v${workspaceCacheVersion}|${userId ?? ""}|${lastUserMsg}|${(memoryRow?.memory_summary ?? "").slice(0, 200)}`,
    );
    const startedAt = Date.now();

    // Cache lookup (only for non-streaming-style first hits; non-streaming convenience)
    const { data: cached } = await admin
      .from("ai_cache")
      .select("output, expires_at")
      .eq("key", cacheKey)
      .maybeSingle();

    if (cached && new Date(cached.expires_at).getTime() > Date.now()) {
      const text = (cached.output as { text?: string })?.text ?? "";
      await admin.from("ai_usage_log").insert({
        user_id: userId ?? null,
        module: moduleType ?? "mentor",
        tokens_in: 0,
        tokens_out: 0,
        latency_ms: Date.now() - startedAt,
        cache_hit: true,
      });
      // Return as a single SSE-style stream so client UI keeps working
      const stream = new ReadableStream({
        start(controller) {
          const chunk = {
            choices: [{ delta: { content: text }, finish_reason: "stop" }],
          };
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const aiMessages = [
      { role: "system", content: basePrompt + contextBlock + memoryBlock },
      ...trimmedMessages.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ];

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: aiMessages,
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error", response.status, text);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI is busy. Try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error(`Gateway ${response.status}`);
    }

    // Tee the stream: forward to client; aggregate to cache + usage log
    const [forwardStream, captureStream] = response.body!.tee();

    (async () => {
      try {
        const reader = captureStream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let aggregated = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload);
              const delta = json.choices?.[0]?.delta?.content;
              if (typeof delta === "string") aggregated += delta;
            } catch { /* skip */ }
          }
        }
        const latency = Date.now() - startedAt;
        await Promise.all([
          admin.from("ai_cache").upsert({
            key: cacheKey,
            action: moduleType ?? "mentor",
            input: { messages, workspaceId },
            output: { text: aggregated },
            model: "google/gemini-3-flash-preview",
            expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
          }, { onConflict: "key" }),
          admin.from("ai_usage_log").insert({
            user_id: userId ?? null,
            module: moduleType ?? "mentor",
            tokens_in: estimateTokens(JSON.stringify(aiMessages)),
            tokens_out: estimateTokens(aggregated),
            latency_ms: latency,
            cache_hit: false,
          }),
        ]);

        // Memory summarizer: hourly, when conversation has enough signal
        if (userId) {
          try {
            const userMsgCount = messages.filter((m: { role: string }) => m.role === "user").length;
            const lastUpdated = memoryRow?.updated_at ? new Date(memoryRow.updated_at).getTime() : 0;
            const stale = Date.now() - lastUpdated > 60 * 60 * 1000;
            if (userMsgCount >= 4 && stale) {
              await summarizeAndSaveMemory({
                admin,
                userId,
                LOVABLE_API_KEY,
                conversation: [...messages, { role: "assistant", content: aggregated }].slice(-30),
                workspace: liveContext,
              });
            }
          } catch (e) {
            console.error("memory summarizer error", e);
          }
        }
      } catch (e) {
        console.error("capture error", e);
      }
    })();

    return new Response(forwardStream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("ai-chat error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function estimateTokens(s: string): number {
  return Math.ceil(s.length / 4);
}

async function summarizeAndSaveMemory(opts: {
  admin: ReturnType<typeof createClient>;
  userId: string;
  LOVABLE_API_KEY: string;
  conversation: Array<{ role: string; content: string }>;
  workspace: unknown;
}) {
  const transcript = opts.conversation
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n")
    .slice(0, 8000);
  const sys = `You build a concise long-term memory profile of a CONTRIVERS user from their AI chats. Return STRICT JSON with keys:
- summary (string, <=400 chars, third person — who they are, what they're building, current focus)
- startup_name (short string or null — proper name of their startup if mentioned)
- startup_description (string <=200 chars or null — one-liner about the startup)
- industry (short string or null)
- target_users (short string or null — who the startup serves)
- goals (array of <=4 short strings — what they're trying to achieve next)
- startup_stage (one of: idea, validation, mvp, launch, growth, scale, unknown)
- preferred_ai_style (one of: concise, detailed, casual, formal, or null)
- interests (array of <=6 short strings)
No prose, no markdown.`;
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: sys },
        {
          role: "user",
          content: `Workspace context (may be null):\n${JSON.stringify(opts.workspace ?? null).slice(0, 1500)}\n\nRecent chat:\n${transcript}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) return;
  const j = await res.json();
  const raw = j.choices?.[0]?.message?.content ?? "{}";
  let parsed: {
    summary?: string;
    startup_name?: string | null;
    startup_description?: string | null;
    industry?: string | null;
    target_users?: string | null;
    goals?: string[];
    startup_stage?: string;
    preferred_ai_style?: string | null;
    interests?: string[];
  } = {};
  try { parsed = JSON.parse(raw); } catch { return; }
  await opts.admin.from("user_ai_memory").upsert(
    {
      user_id: opts.userId,
      memory_summary: (parsed.summary ?? "").slice(0, 600),
      startup_name: parsed.startup_name ?? null,
      startup_description: parsed.startup_description ?? null,
      industry: parsed.industry ?? null,
      target_users: parsed.target_users ?? null,
      goals: Array.isArray(parsed.goals) ? parsed.goals.slice(0, 4) : [],
      startup_stage: parsed.startup_stage ?? null,
      preferred_industry: parsed.industry ?? null,
      preferred_ai_style: parsed.preferred_ai_style ?? null,
      interests: Array.isArray(parsed.interests) ? parsed.interests.slice(0, 6) : [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

async function buildWorkspaceKnowledge(
  admin: ReturnType<typeof createClient>,
  workspaceId: string,
): Promise<{ data: Record<string, unknown>; version: number }> {
  const [ws, det, ver, val, risk, tasks, notes, docs, deck, cacheVer] = await Promise.all([
    admin.from("idea_workspaces").select("*").eq("id", workspaceId).maybeSingle(),
    admin.from("idea_details").select("section, data").eq("workspace_id", workspaceId),
    admin.from("idea_versions").select("*").eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("idea_validations").select("*").eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("risk_analysis").select("*").eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("idea_tasks").select("title, status, priority, due_date")
      .eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(20),
    admin.from("idea_notes").select("title, content, updated_at")
      .eq("workspace_id", workspaceId).order("updated_at", { ascending: false }).limit(5),
    admin.from("idea_documents").select("name, file_type")
      .eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(20),
    admin.from("pitch_decks").select("title, style, mode, slides")
      .eq("workspace_id", workspaceId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("workspace_cache_version").select("version").eq("workspace_id", workspaceId).maybeSingle(),
  ]);

  const detailsMap: Record<string, unknown> = {};
  (det.data ?? []).forEach((d: { section: string; data: unknown }) => {
    detailsMap[d.section] = d.data;
  });

  const deckData = deck.data as { title?: string; style?: string; mode?: string; slides?: unknown[] } | null;

  return {
    version: Number((cacheVer.data as { version?: number } | null)?.version ?? 0),
    data: {
      idea: ws.data ? {
        name: (ws.data as { idea_name?: string }).idea_name,
        one_liner: (ws.data as { one_liner?: string }).one_liner,
        domain: (ws.data as { domain?: string }).domain,
        stage: (ws.data as { stage?: string }).stage,
        progress_percent: (ws.data as { progress_percent?: number }).progress_percent,
      } : null,
      details: detailsMap,
      latest_version: ver.data,
      validation: val.data,
      risk: risk.data,
      tasks: tasks.data ?? [],
      notes: notes.data ?? [],
      documents: (docs.data ?? []).map((d: { name: string; file_type?: string }) => d.name),
      pitch_deck: deckData ? {
        title: deckData.title,
        style: deckData.style,
        mode: deckData.mode,
        slide_count: Array.isArray(deckData.slides) ? deckData.slides.length : 0,
      } : null,
    },
  };
}