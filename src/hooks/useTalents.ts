import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { mockTalents } from "@/data/mockData";

interface Talent {
  id: string;
  user_id: string;
  title: string;
  bio: string | null;
  skills: string[];
  experience_years: number | null;
  resume_url: string | null;
  portfolio_url: string | null;
  availability: "available" | "open" | "not_available";
  preferred_work_type: string[];
  expected_salary_min: number | null;
  expected_salary_max: number | null;
  is_featured: boolean;
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

export function useTalents(filters?: {
  skills?: string[];
  availability?: string;
  minExperience?: number;
  search?: string;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all talents
  const { data: talents = [], isLoading } = useQuery({
    queryKey: ["talents", filters],
    queryFn: async () => {
      let query = supabase
        .from("talents")
        .select("*")
        .neq("availability", "not_available")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (filters?.availability && filters.availability !== "all") {
        query = query.eq("availability", filters.availability);
      }
      if (filters?.minExperience) {
        query = query.gte("experience_years", filters.minExperience);
      }
      if (filters?.skills && filters.skills.length > 0) {
        query = query.overlaps("skills", filters.skills);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles
      const userIds = data.map(t => t.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, headline, email, location")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      let result = data.map(talent => ({
        ...talent,
        profile: profileMap.get(talent.user_id),
      })) as Talent[];

      // Filter by search if provided
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter(t => 
          t.title.toLowerCase().includes(searchLower) ||
          t.profile?.full_name?.toLowerCase().includes(searchLower) ||
          t.skills.some(s => s.toLowerCase().includes(searchLower))
        );
      }

      return result;
    },
  });

  // Fetch my talent profile
  const { data: myTalentProfile } = useQuery({
    queryKey: ["talent-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("talents")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Talent | null;
    },
    enabled: !!user,
  });

  // Create/update talent profile
  const upsertTalentProfile = useMutation({
    mutationFn: async (talent: Omit<Talent, "id" | "user_id" | "is_featured" | "created_at" | "profile">) => {
      if (!user) throw new Error("Must be logged in");
      
      const { data, error } = await supabase
        .from("talents")
        .upsert({
          ...talent,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update profile flag
      await supabase
        .from("profiles")
        .update({ is_talent: true })
        .eq("id", user.id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
      queryClient.invalidateQueries({ queryKey: ["talents"] });
      toast({ title: "Talent profile saved!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete talent profile
  const deleteTalentProfile = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");
      
      const { error } = await supabase
        .from("talents")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      // Update profile flag
      await supabase
        .from("profiles")
        .update({ is_talent: false })
        .eq("id", user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
      queryClient.invalidateQueries({ queryKey: ["talents"] });
      toast({ title: "Talent profile removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Featured talents
  const { data: featuredTalents = [] } = useQuery({
    queryKey: ["talents", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("talents")
        .select("*")
        .eq("is_featured", true)
        .eq("availability", "available")
        .limit(8);

      if (error) throw error;

      const userIds = data.map(t => t.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, headline, email, location")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(talent => ({
        ...talent,
        profile: profileMap.get(talent.user_id),
      })) as Talent[];
    },
  });

  // Use mock data as fallback when DB is empty
  const displayTalents = talents.length > 0 ? talents : mockTalents as unknown as Talent[];
  const displayFeatured = featuredTalents.length > 0 ? featuredTalents : mockTalents.filter(t => t.is_featured) as unknown as Talent[];

  return {
    talents: displayTalents,
    featuredTalents: displayFeatured,
    myTalentProfile,
    isLoading,
    upsertTalentProfile,
    deleteTalentProfile,
    hasTalentProfile: !!myTalentProfile,
  };
}
