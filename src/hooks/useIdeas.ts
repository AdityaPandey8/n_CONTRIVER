import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Idea {
  id: string;
  user_id: string;
  title: string;
  description: string;
  domain: string;
  target_market: string | null;
  problem_statement: string | null;
  solution: string | null;
  is_ai_generated: boolean;
  votes_count: number;
  comments_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  userVote?: "up" | "down" | null;
}

const PAGE_SIZE = 12;

export function useIdeas(domain?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch ideas with infinite scroll
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["ideas", domain],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("ideas")
        .select("*")
        .eq("is_published", true)
        .order("votes_count", { ascending: false })
        .range(from, to);

      if (domain && domain !== "all") {
        query = query.eq("domain", domain);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch author profiles
      const userIds = [...new Set(data.map(i => i.user_id))];
      let profileMap = new Map();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);
        profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      }

      // Fetch user votes if logged in
      let userVotes: Record<string, string> = {};
      if (user && data.length > 0) {
        const { data: votes } = await supabase
          .from("idea_votes")
          .select("idea_id, vote_type")
          .eq("user_id", user.id)
          .in("idea_id", data.map(i => i.id));
        
        userVotes = Object.fromEntries(votes?.map(v => [v.idea_id, v.vote_type]) || []);
      }

      return data.map(idea => ({
        ...idea,
        author: profileMap.get(idea.user_id),
        userVote: userVotes[idea.id] as "up" | "down" | null || null,
      })) as Idea[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PAGE_SIZE ? allPages.length : undefined;
    },
  });

  // Flatten pages into a single array
  const ideas = data?.pages.flat() ?? [];

  // Fetch user's ideas
  const { data: myIdeas = [], isLoading: loadingMyIdeas } = useQuery({
    queryKey: ["ideas", "my", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Idea[];
    },
    enabled: !!user,
  });

  // Create idea
  const createIdea = useMutation({
    mutationFn: async (idea: {
      title: string;
      description: string;
      domain: string;
      target_market?: string;
      problem_statement?: string;
      solution?: string;
      is_ai_generated?: boolean;
    }) => {
      if (!user) throw new Error("Must be logged in");
      
      const { data, error } = await supabase
        .from("ideas")
        .insert({
          ...idea,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      toast({ title: "Idea submitted!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Vote on idea
  const vote = useMutation({
    mutationFn: async ({ ideaId, voteType }: { ideaId: string; voteType: "up" | "down" }) => {
      if (!user) throw new Error("Must be logged in");

      const { data: existing } = await supabase
        .from("idea_votes")
        .select("id, vote_type")
        .eq("idea_id", ideaId)
        .eq("user_id", user.id)
        .single();

      if (existing) {
        if (existing.vote_type === voteType) {
          await supabase.from("idea_votes").delete().eq("id", existing.id);
        } else {
          await supabase.from("idea_votes").update({ vote_type: voteType }).eq("id", existing.id);
        }
      } else {
        await supabase.from("idea_votes").insert({
          idea_id: ideaId,
          user_id: user.id,
          vote_type: voteType,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error voting", description: error.message, variant: "destructive" });
    },
  });

  // Update idea
  const updateIdea = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Idea> & { id: string }) => {
      const { error } = await supabase
        .from("ideas")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      toast({ title: "Idea updated!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete idea
  const deleteIdea = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ideas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      toast({ title: "Idea deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return {
    ideas,
    myIdeas,
    isLoading,
    loadingMyIdeas,
    createIdea,
    vote,
    updateIdea,
    deleteIdea,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
