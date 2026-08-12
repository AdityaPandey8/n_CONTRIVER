import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FollowProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export function useFollow(targetUserId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: isFollowing, isLoading: checkingFollow } = useQuery({
    queryKey: ["follow-status", user?.id, targetUserId],
    queryFn: async () => {
      if (!user || !targetUserId) return false;

      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!targetUserId,
  });

  const { data: followers, isLoading: loadingFollowers } = useQuery({
    queryKey: ["followers", targetUserId || user?.id],
    queryFn: async () => {
      const userId = targetUserId || user?.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from("follows")
        .select(`
          follower:profiles!follows_follower_id_fkey(id, full_name, avatar_url, bio)
        `)
        .eq("following_id", userId);

      if (error) throw error;
      return data?.map((f) => f.follower).filter(Boolean) as FollowProfile[];
    },
    enabled: !!targetUserId || !!user?.id,
  });

  const { data: following, isLoading: loadingFollowing } = useQuery({
    queryKey: ["following", targetUserId || user?.id],
    queryFn: async () => {
      const userId = targetUserId || user?.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from("follows")
        .select(`
          following:profiles!follows_following_id_fkey(id, full_name, avatar_url, bio)
        `)
        .eq("follower_id", userId);

      if (error) throw error;
      return data?.map((f) => f.following).filter(Boolean) as FollowProfile[];
    },
    enabled: !!targetUserId || !!user?.id,
  });

  const follow = useMutation({
    mutationFn: async (followingId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: followingId,
      });

      if (error) throw error;

      // Create notification
      await supabase.from("notifications").insert({
        user_id: followingId,
        actor_id: user.id,
        type: "follow",
        title: "New follower",
        message: "started following you",
        target_type: "profile",
        target_id: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-status"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    },
  });

  const unfollow = useMutation({
    mutationFn: async (followingId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", followingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-status"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    },
  });

  return {
    isFollowing: isFollowing || false,
    checkingFollow,
    followers: followers || [],
    following: following || [],
    loadingFollowers,
    loadingFollowing,
    followersCount: followers?.length || 0,
    followingCount: following?.length || 0,
    follow,
    unfollow,
  };
}

export function useSubscribe(creatorId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: isSubscribed, isLoading } = useQuery({
    queryKey: ["subscription-status", user?.id, creatorId],
    queryFn: async () => {
      if (!user || !creatorId) return false;

      const { data, error } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("subscriber_id", user.id)
        .eq("creator_id", creatorId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!creatorId,
  });

  const subscribe = useMutation({
    mutationFn: async (creatorIdToSub: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("subscriptions").insert({
        subscriber_id: user.id,
        creator_id: creatorIdToSub,
      });

      if (error) throw error;

      // Create notification
      await supabase.from("notifications").insert({
        user_id: creatorIdToSub,
        actor_id: user.id,
        type: "subscribe",
        title: "New subscriber",
        message: "subscribed to your content",
        target_type: "profile",
        target_id: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-status"] });
      queryClient.invalidateQueries({ queryKey: ["shorts"] });
    },
  });

  const unsubscribe = useMutation({
    mutationFn: async (creatorIdToUnsub: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("subscriber_id", user.id)
        .eq("creator_id", creatorIdToUnsub);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-status"] });
      queryClient.invalidateQueries({ queryKey: ["shorts"] });
    },
  });

  return {
    isSubscribed: isSubscribed || false,
    isLoading,
    subscribe,
    unsubscribe,
  };
}
