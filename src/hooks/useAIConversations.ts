import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { AIModuleKey } from "@/lib/aiModules";

export interface AIConversation {
  id: string;
  user_id: string;
  workspace_id: string | null;
  module_type: AIModuleKey;
  title: string;
  is_pinned: boolean;
  is_favorite: boolean;
  is_shared: boolean;
  share_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function useAIConversations(moduleType?: AIModuleKey, search?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["ai-conversations", user?.id, moduleType ?? "all", search ?? ""],
    queryFn: async (): Promise<AIConversation[]> => {
      if (!user) return [];
      let q = supabase
        .from("ai_conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(200);
      if (moduleType) q = q.eq("module_type", moduleType);
      if (search && search.trim()) q = q.ilike("title", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AIConversation[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (input: {
      moduleType: AIModuleKey;
      title?: string;
      workspaceId?: string | null;
    }): Promise<AIConversation> => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("ai_conversations")
        .insert({
          user_id: user.id,
          module_type: input.moduleType,
          title: input.title ?? "New chat",
          workspace_id: input.workspaceId ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as AIConversation;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-conversations"] }),
  });

  const update = useMutation({
    mutationFn: async (input: { id: string; patch: Partial<AIConversation> }) => {
      const { error } = await supabase
        .from("ai_conversations")
        .update(input.patch as never)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-conversations"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ai_conversations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-conversations"] }),
  });

  return { list, create, update, remove };
}

export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["conversation-messages", conversationId],
    queryFn: async (): Promise<ConversationMessage[]> => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from("conversation_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ConversationMessage[];
    },
    enabled: !!conversationId,
  });
}

export function useSaveMessage() {
  const qc = useQueryClient();
  return useCallback(
    async (input: {
      conversationId: string;
      role: "user" | "assistant";
      content: string;
    }) => {
      const { error } = await supabase.from("conversation_messages").insert({
        conversation_id: input.conversationId,
        role: input.role,
        content: input.content,
      });
      if (error) console.error("Failed to save message", error);
      await supabase
        .from("ai_conversations")
        .update({ updated_at: new Date().toISOString() } as never)
        .eq("id", input.conversationId);
      qc.invalidateQueries({ queryKey: ["conversation-messages", input.conversationId] });
    },
    [qc],
  );
}