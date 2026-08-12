import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface SavedPost {
  id: string;
  user_id: string;
  target_type: "post" | "short";
  target_id: string;
  created_at: string;
  post?: {
    id: string;
    caption: string | null;
    media_url: string | null;
    content_type: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    author?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    };
  };
  short?: {
    id: string;
    title: string;
    video_url: string;
    thumbnail_url: string | null;
    likes_count: number;
    comments_count: number;
    views_count: number;
    created_at: string;
    creator?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    };
  };
}

export function useSavedPosts() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: savedPosts, isLoading, error, refetch } = useQuery({
    queryKey: ["saved-posts", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("saved_posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch the actual posts and shorts
      const postIds = data.filter(s => s.target_type === "post").map(s => s.target_id);
      const shortIds = data.filter(s => s.target_type === "short").map(s => s.target_id);

      const [postsResult, shortsResult] = await Promise.all([
        postIds.length > 0 
          ? supabase
              .from("posts")
              .select("*, author:profiles!posts_user_id_fkey(id, full_name, avatar_url)")
              .in("id", postIds)
          : { data: [] },
        shortIds.length > 0
          ? supabase
              .from("shorts")
              .select("*, creator:profiles!shorts_creator_id_fkey(id, full_name, avatar_url)")
              .in("id", shortIds)
          : { data: [] },
      ]);

      const postsMap = new Map((postsResult.data || []).map(p => [p.id, p]));
      const shortsMap = new Map((shortsResult.data || []).map(s => [s.id, s]));

      return data.map(saved => ({
        ...saved,
        post: saved.target_type === "post" ? postsMap.get(saved.target_id) : undefined,
        short: saved.target_type === "short" ? shortsMap.get(saved.target_id) : undefined,
      })) as SavedPost[];
    },
    enabled: !!user,
  });

  const { data: savedIds } = useQuery({
    queryKey: ["saved-post-ids", user?.id],
    queryFn: async () => {
      if (!user) return { posts: new Set<string>(), shorts: new Set<string>() };

      const { data, error } = await supabase
        .from("saved_posts")
        .select("target_type, target_id")
        .eq("user_id", user.id);

      if (error) throw error;

      const posts = new Set<string>();
      const shorts = new Set<string>();

      data?.forEach(s => {
        if (s.target_type === "post") posts.add(s.target_id);
        else if (s.target_type === "short") shorts.add(s.target_id);
      });

      return { posts, shorts };
    },
    enabled: !!user,
  });

  const savePost = useMutation({
    mutationFn: async ({ targetId, targetType }: { targetId: string; targetType: "post" | "short" }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("saved_posts")
        .insert({
          user_id: user.id,
          target_id: targetId,
          target_type: targetType,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
      queryClient.invalidateQueries({ queryKey: ["saved-post-ids"] });
      toast({
        title: "Saved!",
        description: "Added to your saved items.",
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

  const unsavePost = useMutation({
    mutationFn: async ({ targetId, targetType }: { targetId: string; targetType: "post" | "short" }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("user_id", user.id)
        .eq("target_id", targetId)
        .eq("target_type", targetType);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
      queryClient.invalidateQueries({ queryKey: ["saved-post-ids"] });
      toast({
        title: "Removed",
        description: "Removed from your saved items.",
      });
    },
  });

  const toggleSave = async (targetId: string, targetType: "post" | "short") => {
    const isSaved = targetType === "post" 
      ? savedIds?.posts.has(targetId) 
      : savedIds?.shorts.has(targetId);

    if (isSaved) {
      await unsavePost.mutateAsync({ targetId, targetType });
    } else {
      await savePost.mutateAsync({ targetId, targetType });
    }
  };

  const isSaved = (targetId: string, targetType: "post" | "short") => {
    return targetType === "post" 
      ? savedIds?.posts.has(targetId) || false
      : savedIds?.shorts.has(targetId) || false;
  };

  // Separate saved posts and shorts for easy access
  const savedPostItems = (savedPosts || []).filter(s => s.target_type === "post" && s.post).map(s => s.post!);
  const savedShortItems = (savedPosts || []).filter(s => s.target_type === "short" && s.short).map(s => s.short!);

  return {
    savedPosts: savedPostItems,
    savedShorts: savedShortItems,
    allSavedItems: savedPosts || [],
    savedIds: savedIds || { posts: new Set<string>(), shorts: new Set<string>() },
    isLoading,
    error,
    refetch,
    savePost,
    unsavePost,
    toggleSave,
    isSaved,
  };
}
