import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AISettings {
  id: string;
  validation_weights: { demand: number; feasibility: number; innovation: number; scalability: number };
  match_weights: {
    mentor: { skill: number; domain: number; experience: number };
    investor: { industry: number; stage: number; funding: number };
    idea: { similarity_threshold: number };
  };
  modules_enabled: { validation: boolean; strategy: boolean; chat: boolean; match: boolean };
}

export function useAISettings() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const query = useQuery({
    queryKey: ["ai-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_settings").select("*").maybeSingle();
      if (error) throw error;
      return data as unknown as AISettings | null;
    },
  });
  const update = useMutation({
    mutationFn: async (patch: Partial<AISettings>) => {
      if (!query.data?.id) throw new Error("Settings not loaded");
      const { error } = await supabase
        .from("ai_settings")
        .update({ ...patch, updated_at: new Date().toISOString() } as never)
        .eq("id", query.data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "AI settings saved" });
      qc.invalidateQueries({ queryKey: ["ai-settings"] });
    },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });
  return { settings: query.data, isLoading: query.isLoading, update };
}