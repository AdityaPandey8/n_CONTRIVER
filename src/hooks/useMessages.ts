import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachment_url: string | null;
  attachment_type: "image" | "file" | "video" | null;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  participants: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  }[];
  last_message?: Message;
  unread_count: number;
}

export function useConversations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: conversations, isLoading, error, refetch } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get user's conversations
      const { data: participations, error: partError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (partError) throw partError;
      if (!participations?.length) return [];

      const conversationIds = participations.map((p) => p.conversation_id);

      // Get conversation details with participants
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      if (convError) throw convError;

      // Get participants and last message for each conversation
      const conversationsWithDetails = await Promise.all(
        (convData || []).map(async (conv) => {
          // Get participants (excluding current user)
          const { data: participants } = await supabase
            .from("conversation_participants")
            .select(`
              user:profiles!conversation_participants_user_id_fkey(id, full_name, avatar_url)
            `)
            .eq("conversation_id", conv.id)
            .neq("user_id", user.id);

          // Get last message
          const { data: messages } = await supabase
            .from("messages")
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
            `)
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1);

          // Get unread count
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("is_read", false)
            .neq("sender_id", user.id);

          return {
            ...conv,
            participants: participants?.map((p) => p.user).filter(Boolean) || [],
            last_message: messages?.[0] || undefined,
            unread_count: count || 0,
          } as Conversation;
        })
      );

      return conversationsWithDetails;
    },
    enabled: !!user,
  });

  const createConversation = useMutation({
    mutationFn: async (participantIds: string[]) => {
      if (!user) throw new Error("Not authenticated");

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();

      if (convError) throw convError;

      // Add participants (including current user)
      const allParticipants = [...new Set([user.id, ...participantIds])];
      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert(
          allParticipants.map((userId) => ({
            conversation_id: conversation.id,
            user_id: userId,
          }))
        );

      if (partError) throw partError;

      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Real-time subscription for conversation updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  return {
    conversations: conversations || [],
    isLoading,
    error,
    refetch,
    createConversation,
  };
}

export function useMessages(conversationId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: messages, isLoading, error, refetch } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId,
  });

  const sendMessage = useMutation({
    mutationFn: async ({
      content,
      attachmentUrl,
      attachmentType,
    }: {
      content: string;
      attachmentUrl?: string;
      attachmentType?: "image" | "file" | "video";
    }) => {
      if (!user || !conversationId) throw new Error("Not authenticated or no conversation");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          attachment_url: attachmentUrl || null,
          attachment_type: attachmentType || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      // Get other participants and create notifications
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conversationId)
        .neq("user_id", user.id);

      if (participants) {
        await Promise.all(
          participants.map((p) =>
            supabase.from("notifications").insert({
              user_id: p.user_id,
              actor_id: user.id,
              type: "message",
              title: "New message",
              message: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
              target_type: "conversation",
              target_id: conversationId,
            })
          )
        );
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const markMessagesAsRead = useMutation({
    mutationFn: async () => {
      if (!user || !conversationId) return;

      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Real-time subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, refetch]);

  return {
    messages: messages || [],
    isLoading,
    error,
    refetch,
    sendMessage,
    markMessagesAsRead,
  };
}
