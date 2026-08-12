import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Comment {
  id: string;
  user_id: string;
  target_type: "post" | "short";
  target_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  replies?: Comment[];
  is_liked?: boolean;
}

export function useComments(targetType: "post" | "short", targetId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: comments, isLoading, error, refetch } = useQuery({
    queryKey: ["comments", targetType, targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          author:profiles!comments_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .is("parent_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: replies } = await supabase
            .from("comments")
            .select(`
              *,
              author:profiles!comments_user_id_fkey(id, full_name, avatar_url)
            `)
            .eq("parent_id", comment.id)
            .order("created_at", { ascending: true });

          return {
            ...comment,
            replies: replies || [],
          };
        })
      );

      // Check which comments user has liked
      if (user) {
        const allCommentIds = [
          ...commentsWithReplies.map((c) => c.id),
          ...commentsWithReplies.flatMap((c) => c.replies?.map((r) => r.id) || []),
        ];

        const { data: likes } = await supabase
          .from("likes")
          .select("target_id")
          .eq("user_id", user.id)
          .eq("target_type", "comment")
          .in("target_id", allCommentIds);

        const likedIds = new Set(likes?.map((l) => l.target_id) || []);

        return commentsWithReplies.map((comment) => ({
          ...comment,
          target_type: comment.target_type as "post" | "short",
          is_liked: likedIds.has(comment.id),
          replies: comment.replies?.map((reply) => ({
            ...reply,
            target_type: reply.target_type as "post" | "short",
            is_liked: likedIds.has(reply.id),
          })),
        })) as Comment[];
      }

      return commentsWithReplies.map((c) => ({
        ...c,
        target_type: c.target_type as "post" | "short",
        replies: c.replies?.map((r) => ({
          ...r,
          target_type: r.target_type as "post" | "short",
        })),
      })) as Comment[];
    },
    enabled: !!targetId,
  });

  const addComment = useMutation({
    mutationFn: async ({
      content,
      parentId,
      ownerId,
    }: {
      content: string;
      parentId?: string;
      ownerId?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("comments")
        .insert({
          user_id: user.id,
          target_type: targetType,
          target_id: targetId,
          parent_id: parentId || null,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification if ownerId is provided
      if (ownerId && ownerId !== user.id) {
        await supabase.from("notifications").insert({
          user_id: ownerId,
          actor_id: user.id,
          type: "comment",
          title: "New comment",
          message: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
          target_type: targetType,
          target_id: targetId,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", targetType, targetId] });
      if (targetType === "post") {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["shorts"] });
      }
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", targetType, targetId] });
      if (targetType === "post") {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["shorts"] });
      }
    },
  });

  return {
    comments: comments || [],
    isLoading,
    error,
    refetch,
    addComment,
    deleteComment,
  };
}
