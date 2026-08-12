import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useIdeaEvolution(workspaceId?: string) {
  return useQuery({
    queryKey: ["idea-evolution", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return { versions: [], comparison: null };
      const { data, error } = await supabase.functions.invoke("idea-evolution", {
        body: { workspace_id: workspaceId },
      });
      if (error) throw error;
      return data ?? { versions: [], comparison: null };
    },
    enabled: !!workspaceId,
  });
}

export function useLatestRisk(workspaceId?: string) {
  return useQuery({
    queryKey: ["risk-analysis", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      const { data, error } = await supabase
        .from("risk_analysis")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}
