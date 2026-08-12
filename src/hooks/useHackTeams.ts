import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useTeammatePosts(hackathonId?: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const posts = useQuery({
    queryKey: ["teammate-posts", hackathonId || "all"],
    queryFn: async () => {
      let q = supabase
        .from("hackathon_teammate_posts")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(50);
      if (hackathonId) q = q.eq("hackathon_id", hackathonId);
      const { data, error } = await q;
      if (error) throw error;
      const rows = data || [];
      const userIds = Array.from(new Set(rows.map((r: any) => r.user_id)));
      let profileMap = new Map<string, any>();
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, headline, skills, tech_stack, github_url, portfolio_url")
          .in("id", userIds);
        profs?.forEach((p: any) => profileMap.set(p.id, p));
      }
      return rows.map((r: any) => ({ ...r, user: profileMap.get(r.user_id) || null }));
    },
  });

  const createPost = useMutation({
    mutationFn: async (input: { hackathon_id: string; headline: string; message?: string; looking_for_skills?: string[]; role_preference?: string; availability?: string; }) => {
      if (!user) throw new Error("Sign in required");
      const { error } = await supabase.from("hackathon_teammate_posts").insert({ user_id: user.id, ...input });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teammate-posts"] });
      toast({ title: "Posted", description: "Your teammate search is live." });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Failed", description: e.message }),
  });

  return { posts, createPost };
}