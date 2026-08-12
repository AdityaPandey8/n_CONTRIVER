import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: ue } = await supabase.auth.getUser();
    if (ue || !user) throw new Error("Unauthorized");

    const { lesson_id, workspace_tab } = await req.json();
    if (!lesson_id || !workspace_tab) throw new Error("Missing lesson_id or workspace_tab");

    // Check if user has any workspace with relevant data
    const { data: workspaces } = await supabase
      .from("idea_workspaces")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    if (!workspaces || workspaces.length === 0) {
      return new Response(JSON.stringify({ verified: false, reason: "No idea workspace found. Create one first." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wsId = workspaces[0].id;
    let verified = false;
    let reason = "";

    // Verification logic based on workspace_tab
    switch (workspace_tab) {
      case "details": {
        const { data } = await supabase.from("idea_details").select("id").eq("workspace_id", wsId).limit(1);
        verified = (data && data.length > 0);
        reason = verified ? "Idea details completed" : "Fill in your idea details in the workspace";
        break;
      }
      case "validation": {
        const { data } = await supabase.from("idea_validations").select("id").eq("workspace_id", wsId).limit(1);
        verified = (data && data.length > 0);
        reason = verified ? "Idea validated" : "Run AI validation on your idea";
        break;
      }
      case "pitch": {
        const { data } = await supabase.from("pitch_decks").select("id").eq("workspace_id", wsId).limit(1);
        verified = (data && data.length > 0);
        reason = verified ? "Pitch deck created" : "Generate a pitch deck for your idea";
        break;
      }
      case "tasks": {
        const { data } = await supabase.from("idea_tasks").select("id").eq("workspace_id", wsId).limit(1);
        verified = (data && data.length > 0);
        reason = verified ? "Tasks created" : "Add tasks to your workspace";
        break;
      }
      case "documents": {
        const { data } = await supabase.from("idea_documents").select("id").eq("workspace_id", wsId).limit(1);
        verified = (data && data.length > 0);
        reason = verified ? "Documents uploaded" : "Upload a document to your workspace";
        break;
      }
      case "feedback": {
        const { data } = await supabase.from("idea_feedback").select("id").eq("workspace_id", wsId).limit(1);
        verified = (data && data.length > 0);
        reason = verified ? "Feedback received" : "Get feedback on your idea";
        break;
      }
      default: {
        // For overview/general lessons, check workspace exists (already verified above)
        verified = true;
        reason = "Workspace created";
      }
    }

    return new Response(JSON.stringify({ verified, reason }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
