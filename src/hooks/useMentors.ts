import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { mockMentors } from "@/data/mockData";

interface Mentor {
  id: string;
  user_id: string;
  expertise: string[];
  bio: string | null;
  years_experience: number | null;
  linkedin_url: string | null;
  availability: string;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
    email: string;
    location: string | null;
  };
}

interface MentorApplication {
  id: string;
  user_id: string;
  expertise_areas: string[];
  years_experience: number;
  linkedin_url: string | null;
  bio: string;
  motivation: string;
  status: string;
  admin_feedback: string | null;
  created_at: string;
}

interface MentorStory {
  id: string;
  mentor_id: string;
  title: string;
  content: string;
  story_type: "success" | "failure" | "insight";
  media_url: string | null;
  likes_count: number;
  comments_count: number;
  is_published: boolean;
  created_at: string;
  mentor?: Mentor;
}

export function useMentors(expertise?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch verified mentors
  const { data: mentors = [], isLoading } = useQuery({
    queryKey: ["mentors", expertise],
    queryFn: async () => {
      let query = supabase
        .from("mentors")
        .select("*")
        .eq("is_verified", true)
        .order("rating", { ascending: false });

      if (expertise && expertise !== "all") {
        query = query.contains("expertise", [expertise]);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles
      const userIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, headline, email, location")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(mentor => ({
        ...mentor,
        profile: profileMap.get(mentor.user_id),
      })) as Mentor[];
    },
  });

  // Check if current user has applied
  const { data: myApplication } = useQuery({
    queryKey: ["mentor-application", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("mentor_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as MentorApplication | null;
    },
    enabled: !!user,
  });

  // Check if current user is a mentor
  const { data: myMentorProfile } = useQuery({
    queryKey: ["my-mentor-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("mentors")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Mentor | null;
    },
    enabled: !!user,
  });

  // Apply to be a mentor
  const applyAsMentor = useMutation({
    mutationFn: async (application: {
      expertise_areas: string[];
      years_experience: number;
      linkedin_url?: string;
      bio: string;
      motivation: string;
    }) => {
      if (!user) throw new Error("Must be logged in");
      
      const { data, error } = await supabase
        .from("mentor_applications")
        .insert({
          ...application,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-application"] });
      toast({ title: "Application submitted!", description: "We'll review your application soon." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Fetch mentor stories
  const { data: stories = [], isLoading: loadingStories } = useQuery({
    queryKey: ["mentor-stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentor_stories")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch mentor info and profiles
      const mentorIds = [...new Set(data.map(s => s.mentor_id))];
      const { data: mentorData } = await supabase
        .from("mentors")
        .select("*")
        .in("id", mentorIds);

      const userIds = mentorData?.map(m => m.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, headline, email, location")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const mentorMap = new Map(
        mentorData?.map(m => [m.id, { ...m, profile: profileMap.get(m.user_id) }]) || []
      );

      return data.map(story => ({
        ...story,
        mentor: mentorMap.get(story.mentor_id),
      })) as MentorStory[];
    },
  });

  // Create mentor story (for verified mentors)
  const createStory = useMutation({
    mutationFn: async (story: {
      title: string;
      content: string;
      story_type: "success" | "failure" | "insight";
      media_url?: string;
    }) => {
      if (!myMentorProfile) throw new Error("Must be a verified mentor");
      
      const { data, error } = await supabase
        .from("mentor_stories")
        .insert({
          ...story,
          mentor_id: myMentorProfile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-stories"] });
      toast({ title: "Story published!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Use mock data as fallback when DB is empty
  const displayMentors = mentors.length > 0 ? mentors : mockMentors as unknown as Mentor[];

  return {
    mentors: displayMentors,
    stories,
    myApplication,
    myMentorProfile,
    isLoading,
    loadingStories,
    applyAsMentor,
    createStory,
    isMentor: !!myMentorProfile?.is_verified,
    hasApplied: !!myApplication,
    applicationStatus: myApplication?.status,
  };
}
