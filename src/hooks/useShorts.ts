import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Short {
  id: string;
  creator_id: string;
  video_url: string;
  thumbnail_url: string | null;
  title: string;
  description: string | null;
  category: "innovation" | "tech" | "startups" | "business" | "other";
  duration_seconds: number | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_published: boolean;
  created_at: string;
  creator?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  is_liked?: boolean;
  is_subscribed?: boolean;
}

export function useShorts(category?: string, creatorId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: shorts, isLoading, error, refetch } = useQuery({
    queryKey: ["shorts", category, creatorId],
    queryFn: async () => {
      // Fetch both shorts AND video posts to combine into SeedShorts
      const [shortsResult, videoPostsResult] = await Promise.all([
        supabase
          .from("shorts")
          .select(`*, creator:profiles!shorts_creator_id_fkey(id, full_name, avatar_url)`)
          .eq("is_published", true)
          .order("created_at", { ascending: false }),
        supabase
          .from("posts")
          .select(`*, author:profiles!posts_user_id_fkey(id, full_name, avatar_url)`)
          .eq("content_type", "video")
          .eq("is_published", true)
          .order("created_at", { ascending: false }),
      ]);

      if (shortsResult.error) throw shortsResult.error;
      
      // Transform video posts to Short format
      const videoPosts = (videoPostsResult.data || []).map(post => ({
        id: post.id,
        creator_id: post.user_id,
        video_url: post.media_url || "",
        thumbnail_url: post.thumbnail_url,
        title: post.caption || "Video Post",
        description: post.description,
        category: "other" as const,
        duration_seconds: null,
        views_count: 0,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        shares_count: post.shares_count || 0,
        is_published: true,
        created_at: post.created_at,
        creator: post.author,
      }));

      let allShorts = [...(shortsResult.data || []), ...videoPosts];

      // Apply filters
      if (category && category !== "all") {
        allShorts = allShorts.filter(s => s.category === category);
      }
      if (creatorId) {
        allShorts = allShorts.filter(s => s.creator_id === creatorId);
      }

      // Sort by created_at
      allShorts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Check if current user liked/subscribed
      if (user && allShorts.length > 0) {
        const shortIds = allShorts.map((s) => s.id);
        const creatorIds = [...new Set(allShorts.map((s) => s.creator_id))];

        const [likesResult, subscriptionsResult] = await Promise.all([
          supabase.from("likes").select("target_id").eq("user_id", user.id).eq("target_type", "short").in("target_id", shortIds),
          supabase.from("subscriptions").select("creator_id").eq("subscriber_id", user.id).in("creator_id", creatorIds),
        ]);

        const likedIds = new Set(likesResult.data?.map((l) => l.target_id) || []);
        const subscribedIds = new Set(subscriptionsResult.data?.map((s) => s.creator_id) || []);

        return allShorts.map((short) => ({
          ...short,
          is_liked: likedIds.has(short.id),
          is_subscribed: subscribedIds.has(short.creator_id),
        })) as Short[];
      }

      return allShorts as Short[];
    },
  });

  const createShort = useMutation({
    mutationFn: async (newShort: {
      video_url: string;
      thumbnail_url?: string;
      title: string;
      description?: string;
      category: "innovation" | "tech" | "startups" | "business" | "other";
      duration_seconds?: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("shorts")
        .insert({
          creator_id: user.id,
          video_url: newShort.video_url,
          thumbnail_url: newShort.thumbnail_url || null,
          title: newShort.title,
          description: newShort.description || null,
          category: newShort.category,
          duration_seconds: newShort.duration_seconds || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shorts"] });
    },
  });

  const updateShort = useMutation({
    mutationFn: async ({
      shortId,
      updates,
    }: {
      shortId: string;
      updates: Partial<{
        title: string;
        description: string;
        is_published: boolean;
      }>;
    }) => {
      const { data, error } = await supabase
        .from("shorts")
        .update(updates)
        .eq("id", shortId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shorts"] });
    },
  });

  const deleteShort = useMutation({
    mutationFn: async (shortId: string) => {
      const { error } = await supabase.from("shorts").delete().eq("id", shortId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shorts"] });
    },
  });

  const incrementViews = useMutation({
    mutationFn: async (shortId: string) => {
      // Use maybeSingle to handle video posts gracefully (they don't exist in shorts table)
      const { data: currentShort } = await supabase
        .from("shorts")
        .select("views_count")
        .eq("id", shortId)
        .maybeSingle();
      
      // Only increment if it's actually a short (not a video post)
      if (currentShort) {
        await supabase
          .from("shorts")
          .update({ views_count: (currentShort.views_count || 0) + 1 })
          .eq("id", shortId);
      }
      // If not found, it's a video post - skip view tracking silently
    },
  });

  return {
    shorts: shorts || [],
    isLoading,
    error,
    refetch,
    createShort,
    updateShort,
    deleteShort,
    incrementViews,
  };
}
