import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const TABLES = [
  "idea_versions",
  "idea_validations",
  "risk_analysis",
  "match_scores",
  "ai_usage_log",
  "platform_insights",
  "idea_workspaces",
  "idea_details",
  "idea_tasks",
  "idea_notes",
  "pitch_decks",
  "workspace_cache_version",
] as const;

export function useRealtime(enabled = true) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel("contrivers-realtime")
      .on("postgres_changes", { event: "*", schema: "public" }, (payload) => {
        const table = (payload as { table?: string }).table;
        if (!table) return;
        if ((TABLES as readonly string[]).includes(table)) {
          qc.invalidateQueries({ queryKey: [table] });
          qc.invalidateQueries({ queryKey: ["admin"] });
          qc.invalidateQueries({ queryKey: ["ai-usage"] });
          qc.invalidateQueries({ queryKey: ["platform-insights"] });
          qc.invalidateQueries({ queryKey: ["matches"] });
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, qc]);
}