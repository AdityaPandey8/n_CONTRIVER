import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const authHeader = req.headers.get("Authorization") ?? "";
    const { data: claims } = await admin.auth.getClaims(authHeader.replace("Bearer ", ""));
    const caller = claims?.claims?.sub as string | undefined;
    if (!caller) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: caller, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const { title, body, target_roles = [] } = await req.json();
    if (!title || !body) return json({ error: "title and body required" }, 400);

    // Resolve recipients
    let recipients: { id: string }[] = [];
    if (!target_roles.length || target_roles.includes("all")) {
      const { data } = await admin.from("profiles").select("id").limit(5000);
      recipients = data ?? [];
    } else {
      const { data } = await admin
        .from("user_roles")
        .select("user_id")
        .in("role", target_roles);
      recipients = (data ?? []).map((r) => ({ id: r.user_id }));
    }

    // Log broadcast
    await admin.from("broadcast_messages").insert({
      sender_id: caller,
      title,
      body,
      target_roles,
      recipients_count: recipients.length,
    });

    // Fan out notifications in batches
    const chunkSize = 500;
    for (let i = 0; i < recipients.length; i += chunkSize) {
      const slice = recipients.slice(i, i + chunkSize);
      await admin.from("notifications").insert(
        slice.map((r) => ({
          user_id: r.id,
          type: "broadcast",
          title,
          message: body,
          actor_id: caller,
        })),
      );
    }
    return json({ ok: true, recipients: recipients.length });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});