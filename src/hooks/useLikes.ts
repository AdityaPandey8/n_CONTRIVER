import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useLike() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const toggleLike = useMutation({
    mutationFn: async ({
      targetId,
      targetType,
      isLiked,
      ownerId,
    }: {
      targetId: string;
      targetType: "post" | "short" | "comment";
      isLiked: boolean;
      ownerId?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("target_type", targetType)
          .eq("target_id", targetId);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase.from("likes").insert({
          user_id: user.id,
          target_type: targetType,
          target_id: targetId,
        });

        if (error) throw error;

        // Create notification if ownerId is provided and it's not self-like
        if (ownerId && ownerId !== user.id) {
          await supabase.from("notifications").insert({
            user_id: ownerId,
            actor_id: user.id,
            type: "like",
            title: "New like",
            message: `liked your ${targetType}`,
            target_type: targetType,
            target_id: targetId,
          });
        }
      }

      return !isLiked;
    },
    onSuccess: (_, variables) => {
      if (variables.targetType === "post") {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      } else if (variables.targetType === "short") {
        queryClient.invalidateQueries({ queryKey: ["shorts"] });
      }
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });

  return { toggleLike };
}
