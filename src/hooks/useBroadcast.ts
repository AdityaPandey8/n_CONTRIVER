import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useBroadcast() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const history = useQuery({
    queryKey: ["broadcasts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broadcast_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
  const send = useMutation({
    mutationFn: async (payload: { title: string; body: string; target_roles: string[] }) => {
      const { data, error } = await supabase.functions.invoke("broadcast-send", { body: payload });
      if (error) throw error;
      return data as { recipients: number };
    },
    onSuccess: (data) => {
      toast({ title: "Broadcast sent", description: `Reached ${data?.recipients ?? 0} users` });
      qc.invalidateQueries({ queryKey: ["broadcasts"] });
    },
    onError: (e: Error) => toast({ title: "Broadcast failed", description: e.message, variant: "destructive" }),
  });
  return { history: history.data ?? [], isLoading: history.isLoading, send };
}