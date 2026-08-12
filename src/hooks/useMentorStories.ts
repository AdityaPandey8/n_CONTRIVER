import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface MentorStory {
  id: string;
  mentor_id: string;
  title: string;
  content: string;
  story_type: "success" | "failure" | "learning" | "advice";
  media_url: string | null;
  is_published: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  mentor?: {
    id: string;
    user_id: string;
    profile?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      headline: string | null;
    };
  };
  is_liked?: boolean;
}

export function useMentorStories(mentorId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: stories, isLoading, error, refetch } = useQuery({
    queryKey: ["mentor-stories", mentorId],
    queryFn: async () => {
      let query = supabase
        .from("mentor_stories")
        .select(`
          *,
          mentor:mentors!mentor_stories_mentor_id_fkey(
            id,
            user_id,
            profile:profiles!mentors_user_id_fkey(id, full_name, avatar_url, headline)
          )
        `)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (mentorId) {
        query = query.eq("mentor_id", mentorId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Check if user has liked stories
      if (user && data && data.length > 0) {
        const storyIds = data.map(s => s.id);
        const { data: likes } = await supabase
          .from("likes")
          .select("target_id")
          .eq("user_id", user.id)
          .eq("target_type", "story")
          .in("target_id", storyIds);

        const likedIds = new Set(likes?.map(l => l.target_id) || []);
        
        return data.map(story => ({
          ...story,
          is_liked: likedIds.has(story.id),
        })) as MentorStory[];
      }

      return data as MentorStory[];
    },
  });

  const createStory = useMutation({
    mutationFn: async (story: {
      mentor_id: string;
      title: string;
      content: string;
      story_type: "success" | "failure" | "learning" | "advice";
      media_url?: string;
    }) => {
      const { data, error } = await supabase
        .from("mentor_stories")
        .insert({
          ...story,
          is_published: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-stories"] });
      toast({
        title: "Story published!",
        description: "Your story has been shared with the community.",
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

  const updateStory = useMutation({
    mutationFn: async ({ storyId, updates }: { 
      storyId: string; 
      updates: Partial<{ title: string; content: string; story_type: string; is_published: boolean }> 
    }) => {
      const { data, error } = await supabase
        .from("mentor_stories")
        .update(updates)
        .eq("id", storyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-stories"] });
      toast({
        title: "Story updated",
        description: "Your changes have been saved.",
      });
    },
  });

  const deleteStory = useMutation({
    mutationFn: async (storyId: string) => {
      const { error } = await supabase
        .from("mentor_stories")
        .delete()
        .eq("id", storyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-stories"] });
      toast({
        title: "Story deleted",
        description: "Your story has been removed.",
      });
    },
  });

  return {
    stories: stories || [],
    isLoading,
    error,
    refetch,
    createStory,
    updateStory,
    deleteStory,
  };
}
