import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useShare() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const createRepost = useMutation({
    mutationFn: async ({ 
      originalPostId, 
      originalShortId, 
      caption 
    }: { 
      originalPostId?: string; 
      originalShortId?: string; 
      caption?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      if (!originalPostId && !originalShortId) throw new Error("Must provide post or short ID");

      const { data, error } = await supabase
        .from("reposts")
        .insert({
          user_id: user.id,
          original_post_id: originalPostId || null,
          original_short_id: originalShortId || null,
          caption,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reposts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({
        title: "Reposted!",
        description: "Content has been shared to your profile.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const shareToConnection = useMutation({
    mutationFn: async ({ 
      connectionId, 
      postId, 
      shortId,
      message 
    }: { 
      connectionId: string;
      postId?: string; 
      shortId?: string;
      message?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      if (!postId && !shortId) throw new Error("Must provide post or short ID");

      // Create or get existing conversation
      const { data: existingConversation } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      const { data: otherParticipant } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", connectionId);

      const existingConversationId = existingConversation?.find(ec => 
        otherParticipant?.some(op => op.conversation_id === ec.conversation_id)
      )?.conversation_id;

      let conversationId = existingConversationId;

      if (!conversationId) {
        // Create new conversation
        const { data: newConversation, error: convError } = await supabase
          .from("conversations")
          .insert({})
          .select()
          .single();

        if (convError) throw convError;
        conversationId = newConversation.id;

        // Add participants
        await supabase.from("conversation_participants").insert([
          { conversation_id: conversationId, user_id: user.id },
          { conversation_id: conversationId, user_id: connectionId },
        ]);
      }

      // Send message with shared content
      const shareUrl = postId 
        ? `${window.location.origin}/dashboard/post/${postId}`
        : `${window.location.origin}/dashboard/short/${shortId}`;

      const content = message 
        ? `${message}\n\n📎 ${shareUrl}`
        : `📎 Shared content: ${shareUrl}`;

      const { error: msgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
        });

      if (msgError) throw msgError;
    },
    onSuccess: () => {
      toast({
        title: "Shared!",
        description: "Content has been sent to your connection.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error sharing",
        description: error.message,
      });
    },
  });

  const shareToWhatsApp = (title: string, url: string) => {
    const text = encodeURIComponent(`${title}\n\n${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "The link has been copied to your clipboard.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Could not copy link to clipboard.",
      });
    }
  };

  return {
    createRepost,
    shareToConnection,
    shareToWhatsApp,
    copyLink,
  };
}
