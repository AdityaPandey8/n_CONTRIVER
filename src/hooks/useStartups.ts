import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { mockStartups } from "@/data/mockData";

interface Startup {
  id: string;
  founder_id: string;
  name: string;
  tagline: string | null;
  description: string;
  logo_url: string | null;
  industry: string;
  stage: "idea" | "mvp" | "growth" | "scaling";
  founded_date: string | null;
  website_url: string | null;
  pitch_deck_url: string | null;
  funding_status: string;
  amount_raised: number;
  seeking_investment: boolean;
  investment_amount_sought: number | null;
  user_count: number | null;
  revenue: number | null;
  growth_rate: string | null;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
  founder?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
  };
  team_members?: TeamMember[];
}

interface TeamMember {
  id: string;
  startup_id: string;
  user_id: string | null;
  name: string;
  role: string;
  linkedin_url: string | null;
  avatar_url: string | null;
}

interface StartupInterest {
  id: string;
  startup_id: string;
  investor_id: string;
  interest_type: "interested" | "watching" | "contacted";
  message: string | null;
  created_at: string;
}

export function useStartups(industry?: string, stage?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all startups
  const { data: startups = [], isLoading } = useQuery({
    queryKey: ["startups", industry, stage],
    queryFn: async () => {
      let query = supabase
        .from("startups")
        .select("*")
        .order("created_at", { ascending: false });

      if (industry && industry !== "all") {
        query = query.eq("industry", industry);
      }
      if (stage && stage !== "all") {
        query = query.eq("stage", stage);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch founder profiles
      const founderIds = [...new Set(data.map(s => s.founder_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, headline")
        .in("id", founderIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(startup => ({
        ...startup,
        founder: profileMap.get(startup.founder_id),
      })) as Startup[];
    },
  });

  // Fetch featured startups
  const { data: featuredStartups = [] } = useQuery({
    queryKey: ["startups", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startups")
        .select("*")
        .eq("is_featured", true)
        .limit(6);

      if (error) throw error;
      return data as Startup[];
    },
  });

  // Fetch user's startups
  const { data: myStartups = [], isLoading: loadingMyStartups } = useQuery({
    queryKey: ["startups", "my", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("startups")
        .select("*")
        .eq("founder_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Startup[];
    },
    enabled: !!user,
  });

  // Fetch single startup with team
  const getStartup = async (id: string): Promise<Startup | null> => {
    const { data: startup, error } = await supabase
      .from("startups")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;

    // Fetch team members
    const { data: teamMembers } = await supabase
      .from("startup_team_members")
      .select("*")
      .eq("startup_id", id);

    // Fetch founder profile
    const { data: founder } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, headline")
      .eq("id", startup.founder_id)
      .single();

    return {
      ...startup,
      founder,
      team_members: teamMembers || [],
    } as Startup;
  };

  // Register a startup
  const registerStartup = useMutation({
    mutationFn: async (startup: {
      name: string;
      tagline?: string;
      description: string;
      logo_url?: string;
      industry: string;
      stage: "idea" | "mvp" | "growth" | "scaling";
      founded_date?: string;
      website_url?: string;
      pitch_deck_url?: string;
      funding_status?: string;
      amount_raised?: number;
      seeking_investment?: boolean;
      investment_amount_sought?: number;
      team_members?: Omit<TeamMember, "id" | "startup_id">[];
    }) => {
      if (!user) throw new Error("Must be logged in");
      
      const { team_members, ...startupData } = startup;

      const { data, error } = await supabase
        .from("startups")
        .insert({
          ...startupData,
          founder_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add team members if provided
      if (team_members && team_members.length > 0) {
        await supabase.from("startup_team_members").insert(
          team_members.map(member => ({
            ...member,
            startup_id: data.id,
          }))
        );
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups"] });
      toast({ title: "Startup registered successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update startup
  const updateStartup = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Startup> & { id: string }) => {
      const { error } = await supabase
        .from("startups")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups"] });
      toast({ title: "Startup updated!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Express interest in startup (for investors)
  const expressInterest = useMutation({
    mutationFn: async ({ startupId, interestType, message }: {
      startupId: string;
      interestType: "interested" | "watching" | "contacted";
      message?: string;
    }) => {
      if (!user) throw new Error("Must be logged in");
      
      const { error } = await supabase
        .from("startup_interests")
        .upsert({
          startup_id: startupId,
          investor_id: user.id,
          interest_type: interestType,
          message: message || null,
        });

      if (error) throw error;

      // Get startup founder to notify
      const { data: startup } = await supabase
        .from("startups")
        .select("founder_id, name")
        .eq("id", startupId)
        .single();

      if (startup) {
        await supabase.from("notifications").insert({
          user_id: startup.founder_id,
          type: "investor_interest",
          title: "Investor Interest",
          message: `An investor is interested in ${startup.name}`,
          actor_id: user.id,
          target_type: "startup",
          target_id: startupId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startup-interests"] });
      toast({ title: "Interest registered!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Fetch interests for my startups
  const { data: myStartupInterests = [] } = useQuery({
    queryKey: ["startup-interests", user?.id],
    queryFn: async () => {
      if (!user || myStartups.length === 0) return [];
      
      const startupIds = myStartups.map(s => s.id);
      const { data, error } = await supabase
        .from("startup_interests")
        .select("*")
        .in("startup_id", startupIds);

      if (error) throw error;
      return data as StartupInterest[];
    },
    enabled: !!user && myStartups.length > 0,
  });

  // Use mock data as fallback when DB is empty
  const displayStartups = startups.length > 0 ? startups : mockStartups as unknown as Startup[];
  const displayFeatured = featuredStartups.length > 0 ? featuredStartups : mockStartups.filter(s => s.is_featured) as unknown as Startup[];

  return {
    startups: displayStartups,
    featuredStartups: displayFeatured,
    myStartups,
    myStartupInterests,
    isLoading,
    loadingMyStartups,
    getStartup,
    registerStartup,
    updateStartup,
    expressInterest,
  };
}
