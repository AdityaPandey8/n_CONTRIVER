import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface PitchSlide {
  slide_type: string;
  title: string;
  content: string;
  notes: string;
}

export interface PitchDeck {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  slides: PitchSlide[];
  style: string;
  mode: string;
  speaker_notes: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export function usePitchDeck(workspaceId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: pitchDecks = [], isLoading } = useQuery({
    queryKey: ["pitch-decks", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from("pitch_decks")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        slides: Array.isArray(d.slides) ? d.slides : [],
        speaker_notes: typeof d.speaker_notes === "object" && d.speaker_notes ? d.speaker_notes : {},
      })) as PitchDeck[];
    },
    enabled: !!workspaceId,
  });

  const generateDeck = useMutation({
    mutationFn: async (input: {
      ideaName: string;
      oneLiner?: string;
      domain: string;
      stage: string;
      details?: Record<string, any>;
      validationScore?: number;
      style: string;
      mode: string;
    }) => {
      if (!user || !workspaceId) throw new Error("Missing context");

      const { data: fnData, error: fnError } = await supabase.functions.invoke("pitch-deck-generator", {
        body: input,
      });

      if (fnError) throw new Error(fnError.message || "Generation failed");
      if (fnData?.error) throw new Error(fnData.error);

      const slides = fnData.slides || [];

      const { data, error } = await supabase
        .from("pitch_decks")
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
          title: `${input.ideaName} - Pitch Deck`,
          slides: slides as any,
          style: input.style,
          mode: input.mode,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pitch-decks", workspaceId] });
      toast({ title: "Pitch deck generated!" });
    },
    onError: (e: Error) => toast({ title: "Generation failed", description: e.message, variant: "destructive" }),
  });

  const updateDeck = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; slides?: any; title?: string; speaker_notes?: any }) => {
      const { error } = await supabase.from("pitch_decks").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pitch-decks", workspaceId] }),
  });

  const deleteDeck = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pitch_decks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pitch-decks", workspaceId] });
      toast({ title: "Pitch deck deleted" });
    },
  });

  return { pitchDecks, isLoading, generateDeck, updateDeck, deleteDeck };
}
