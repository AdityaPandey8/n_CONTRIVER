import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function usePlatformInsights() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const query = useQuery({
    queryKey: ["platform-insights"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_insights")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
  const refresh = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-intelligence", { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Insights refreshed" });
      qc.invalidateQueries({ queryKey: ["platform-insights"] });
    },
    onError: (e: Error) => toast({ title: "Refresh failed", description: e.message, variant: "destructive" }),
  });
  return { insights: query.data ?? [], isLoading: query.isLoading, refresh };
}