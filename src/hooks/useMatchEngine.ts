import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useMatchEngine() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const topMatches = useQuery({
    queryKey: ["matches", "top"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_scores")
        .select("*")
        .order("score", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
  const recompute = useMutation({
    mutationFn: async (type: "mentor" | "investor" | "idea") => {
      const { data, error } = await supabase.functions.invoke("match-engine", { body: { type, all: true } });
      if (error) throw error;
      return data as { processed: number; type: string };
    },
    onSuccess: (data) => {
      toast({ title: "Recomputed", description: `${data?.processed ?? 0} users (${data?.type})` });
      qc.invalidateQueries({ queryKey: ["matches"] });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
  return { topMatches: topMatches.data ?? [], isLoading: topMatches.isLoading, recompute };
}