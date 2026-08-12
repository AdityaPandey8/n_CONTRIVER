import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Post {
  id: string;
  user_id: string;
  content_type: "image" | "video" | "text";
  media_url: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  description: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  is_liked?: boolean;
}

export function usePosts(userId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: posts, isLoading, error, refetch } = useQuery({
    queryKey: ["posts", userId],
    queryFn: async () => {
      let query = supabase
        .from("posts")
        .select(`
          *,
          author:profiles!posts_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Check if current user liked each post
      if (user && data) {
        const postIds = data.map((p) => p.id);
        const { data: likes } = await supabase
          .from("likes")
          .select("target_id")
          .eq("user_id", user.id)
          .eq("target_type", "post")
          .in("target_id", postIds);

        const likedIds = new Set(likes?.map((l) => l.target_id) || []);
        return data.map((post) => ({
          ...post,
          is_liked: likedIds.has(post.id),
        })) as Post[];
      }

      return data as Post[];
    },
  });

  const createPost = useMutation({
    mutationFn: async (newPost: {
      content_type: "image" | "video" | "text";
      media_url?: string;
      thumbnail_url?: string;
      caption?: string;
      description?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content_type: newPost.content_type,
          media_url: newPost.media_url || null,
          thumbnail_url: newPost.thumbnail_url || null,
          caption: newPost.caption || null,
          description: newPost.description || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const updatePost = useMutation({
    mutationFn: async ({
      postId,
      updates,
    }: {
      postId: string;
      updates: Partial<{
        caption: string;
        description: string;
        is_published: boolean;
      }>;
    }) => {
      const { data, error } = await supabase
        .from("posts")
        .update(updates)
        .eq("id", postId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return {
    posts: posts || [],
    isLoading,
    error,
    refetch,
    createPost,
    updatePost,
    deletePost,
  };
}

export function useUploadMedia() {
  const { user } = useAuth();

  const uploadToStorage = async (
    file: File,
    bucket: "posts" | "shorts" | "avatars"
  ) => {
    if (!user) throw new Error("Not authenticated");

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  return { uploadToStorage };
}
