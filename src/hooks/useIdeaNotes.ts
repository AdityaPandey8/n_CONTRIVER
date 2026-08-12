import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface IdeaNote {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function useIdeaNotes(workspaceId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["idea-notes", workspaceId];

  const list = useQuery({
    queryKey: key,
    queryFn: async (): Promise<IdeaNote[]> => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from("idea_notes")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as IdeaNote[];
    },
    enabled: !!workspaceId,
  });

  const create = useMutation({
    mutationFn: async (input: { title?: string; content?: string }) => {
      if (!user || !workspaceId) throw new Error("Missing context");
      const { data, error } = await supabase
        .from("idea_notes")
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
          title: input.title ?? "Untitled note",
          content: input.content ?? "",
        })
        .select()
        .single();
      if (error) throw error;
      return data as IdeaNote;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const update = useMutation({
    mutationFn: async (input: { id: string; patch: Partial<IdeaNote> }) => {
      const { error } = await supabase
        .from("idea_notes")
        .update(input.patch as never)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("idea_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { list, create, update, remove };
}