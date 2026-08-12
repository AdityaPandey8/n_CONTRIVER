import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

/**
 * End-to-end test:
 * Verifies that opening a completely NEW chat with empty history still produces
 * a context-aware answer because the edge function auto-loads:
 *   1. persistent_user_memory  (user_ai_memory table)
 *   2. workspace knowledge     (idea_workspaces + idea_details + cache version)
 *
 * Seeds a temporary user + workspace, asks "What is my startup idea?" with an
 * empty conversation history, and asserts the streamed answer references the
 * seeded startup name / industry — proving cross-chat memory works.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL") ?? "";
const ANON = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")
  ?? Deno.env.get("SUPABASE_ANON_KEY")
  ?? Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")
  ?? Deno.env.get("VITE_SUPABASE_ANON_KEY")
  ?? "";

const STARTUP_NAME = "NebulaFleet";
const STARTUP_DESC = "Autonomous drone logistics for offshore wind farms.";
const INDUSTRY = "Clean energy logistics";
const TARGET_USERS = "Offshore wind farm operators in the North Sea";

async function seed() {
  // Sign up a fresh test user (frictionless auth: no email confirmation).
  const email = `e2e-${crypto.randomUUID()}@memory-e2e.test`;
  const password = `Test!${crypto.randomUUID()}`;
  const authClient = createClient(SUPABASE_URL, ANON);
  const { data: signUp, error: signErr } = await authClient.auth.signUp({ email, password });
  if (signErr) throw signErr;
  let session = signUp.session;
  if (!session) {
    const { data: signIn, error: siErr } = await authClient.auth.signInWithPassword({ email, password });
    if (siErr) throw siErr;
    session = signIn.session;
  }
  if (!session) throw new Error("could not establish session");
  const userId = session.user.id;

  // Authenticated client (RLS-scoped to this user) for seeding.
  const admin = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
  });

  // user_ai_memory (persistent profile)
  const { error: memErr } = await admin.from("user_ai_memory").upsert({
    user_id: userId,
    startup_name: STARTUP_NAME,
    startup_description: STARTUP_DESC,
    industry: INDUSTRY,
    target_users: TARGET_USERS,
    startup_stage: "mvp",
    goals: ["Raise pre-seed", "Sign 2 pilot customers"],
    preferred_ai_style: "concise",
    memory_summary: `${STARTUP_NAME} founder building drone logistics, currently at MVP.`,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (memErr) throw memErr;

  // workspace
  const { data: ws, error: wsErr } = await admin.from("idea_workspaces").insert({
    user_id: userId,
    idea_name: STARTUP_NAME,
    one_liner: STARTUP_DESC,
    domain: INDUSTRY,
    stage: "mvp",
    progress_percent: 35,
  }).select("id").single();
  if (wsErr) throw wsErr;
  const workspaceId = ws.id as string;

  // workspace details (validation section)
  await admin.from("idea_details").insert({
    workspace_id: workspaceId,
    section: "validation",
    data: { score: 78, signals: ["3 LOIs", "Pilot interest from Ørsted"] },
  });

  return { userId, workspaceId, admin, session };
}

// deno-lint-ignore no-explicit-any
async function cleanup(admin: any, userId: string, workspaceId: string) {
  await admin.from("idea_details").delete().eq("workspace_id", workspaceId);
  await admin.from("workspace_cache_version").delete().eq("workspace_id", workspaceId);
  await admin.from("idea_workspaces").delete().eq("id", workspaceId);
  await admin.from("user_ai_memory").delete().eq("user_id", userId);
  await admin.from("ai_cache").delete().eq("action", "mentor"); // sweep test cache
}

async function readStream(res: Response): Promise<string> {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const j = JSON.parse(payload);
        const delta = j.choices?.[0]?.delta?.content;
        if (typeof delta === "string") out += delta;
      } catch { /* skip */ }
    }
  }
  return out;
}

Deno.test({
  name: "new chat auto-loads persistent memory + workspace knowledge",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
  assert(SUPABASE_URL && ANON, "Missing SUPABASE env vars");

  const { userId, workspaceId, admin, session } = await seed();

  try {
    // Brand NEW chat: empty history except the user's single question.
    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: ANON,
      },
      body: JSON.stringify({
        moduleType: "mentor",
        userId,
        workspaceId,
        conversationId: null,
        workspaceContext: null,
        messages: [{ role: "user", content: "What is my startup idea? Reply in one short sentence." }],
      }),
    });

    assertEquals(res.status, 200, `edge function returned ${res.status}`);
    const answer = await readStream(res);
    console.log("AI answer:", answer);

    // The model should know the startup name WITHOUT the user repeating it,
    // because user_ai_memory + workspace knowledge were auto-injected.
    assert(answer.length > 0, "empty answer");
    assert(
      answer.toLowerCase().includes(STARTUP_NAME.toLowerCase()),
      `expected answer to mention startup name "${STARTUP_NAME}"; got: ${answer}`,
    );
  } finally {
    await cleanup(admin, userId, workspaceId);
  }
  },
});
