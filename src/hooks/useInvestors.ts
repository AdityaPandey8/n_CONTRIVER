import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Investor {
  id: string;
  user_id: string | null;
  name: string;
  firm: string | null;
  bio: string | null;
  focus_domains: string[];
  stage_preference: string[];
  ticket_size_min: number | null;
  ticket_size_max: number | null;
  location: string | null;
  avatar_url: string | null;
  past_investments: any[];
  created_at: string;
  match_score?: number;
}

export function useInvestors() {
  const { data: investors = [], isLoading } = useQuery({
    queryKey: ["investors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investors")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        focus_domains: Array.isArray(d.focus_domains) ? d.focus_domains : [],
        stage_preference: Array.isArray(d.stage_preference) ? d.stage_preference : [],
        past_investments: Array.isArray(d.past_investments) ? d.past_investments : [],
      })) as Investor[];
    },
  });

  return { investors, isLoading };
}

export function useInvestorMatching() {
  const { toast } = useToast();

  const matchInvestors = useMutation({
    mutationFn: async (input: { domain: string; stage: string; validationScore?: number }) => {
      const { data, error } = await supabase.functions.invoke("investor-matcher", { body: input });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.matches as Investor[];
    },
    onError: (e: Error) => toast({ title: "Matching failed", description: e.message, variant: "destructive" }),
  });

  return { matchInvestors };
}

export function usePitchShares(workspaceId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: shares = [] } = useQuery({
    queryKey: ["pitch-shares", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from("pitch_shares")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });

  const sharePitch = useMutation({
    mutationFn: async (input: { investor_id: string; pitch_deck_id?: string; message?: string }) => {
      if (!user || !workspaceId) throw new Error("Missing context");
      const { error } = await supabase.from("pitch_shares").insert({
        user_id: user.id,
        workspace_id: workspaceId,
        ...input,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pitch-shares", workspaceId] });
      toast({ title: "Pitch shared successfully!" });
    },
    onError: (e: Error) => toast({ title: "Share failed", description: e.message, variant: "destructive" }),
  });

  return { shares, sharePitch };
}
