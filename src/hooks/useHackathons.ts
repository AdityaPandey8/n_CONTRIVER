import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { mockHackathons } from "@/data/mockData";

export interface Hackathon {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  organizer: string;
  status: "upcoming" | "live" | "completed";
  prize: string | null;
  start_date: string;
  end_date: string;
  registration_deadline: string | null;
  location: string | null;
  max_participants: number | null;
  tags: string[];
  is_verified: boolean;
  image_url: string | null;
  created_at: string;
  creator?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  registrations_count?: number;
  is_registered?: boolean;
}

export interface HackathonRegistration {
  id: string;
  hackathon_id: string;
  user_id: string;
  team_name: string | null;
  status: string;
  created_at: string;
  hackathon?: Hackathon;
}

export function useHackathons(status?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: hackathons, isLoading, error, refetch } = useQuery({
    queryKey: ["hackathons", status],
    queryFn: async () => {
      let query = supabase
        .from("hackathons")
        .select(`
          *,
          creator:profiles!hackathons_creator_id_fkey(id, full_name, avatar_url)
        `)
        .order("start_date", { ascending: true });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get registration counts and check if user is registered
      if (data && data.length > 0) {
        const hackathonIds = data.map(h => h.id);
        
        const { data: regCounts } = await supabase
          .from("hackathon_registrations")
          .select("hackathon_id")
          .in("hackathon_id", hackathonIds);

        const countMap = new Map<string, number>();
        regCounts?.forEach(r => {
          countMap.set(r.hackathon_id, (countMap.get(r.hackathon_id) || 0) + 1);
        });

        let userRegistrations = new Set<string>();
        if (user) {
          const { data: userRegs } = await supabase
            .from("hackathon_registrations")
            .select("hackathon_id")
            .eq("user_id", user.id)
            .in("hackathon_id", hackathonIds);
          
          userRegs?.forEach(r => userRegistrations.add(r.hackathon_id));
        }

        return data.map(h => ({
          ...h,
          registrations_count: countMap.get(h.id) || 0,
          is_registered: userRegistrations.has(h.id),
        })) as Hackathon[];
      }

      return data as Hackathon[];
    },
  });

  const { data: myRegistrations, isLoading: loadingRegistrations } = useQuery({
    queryKey: ["hackathon-registrations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("hackathon_registrations")
        .select(`
          *,
          hackathon:hackathons(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as HackathonRegistration[];
    },
    enabled: !!user,
  });

  const createHackathon = useMutation({
    mutationFn: async (hackathon: {
      title: string;
      description: string;
      organizer: string;
      prize?: string;
      start_date: string;
      end_date: string;
      registration_deadline?: string;
      location?: string;
      max_participants?: number;
      tags?: string[];
      image_url?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("hackathons")
        .insert({
          creator_id: user.id,
          ...hackathon,
          is_verified: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hackathons"] });
      toast({
        title: "Hackathon submitted",
        description: "Your hackathon has been submitted for verification.",
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

  const registerForHackathon = useMutation({
    mutationFn: async ({ hackathonId, teamName }: { hackathonId: string; teamName?: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("hackathon_registrations")
        .insert({
          hackathon_id: hackathonId,
          user_id: user.id,
          team_name: teamName || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hackathons"] });
      queryClient.invalidateQueries({ queryKey: ["hackathon-registrations"] });
      toast({
        title: "Registered!",
        description: "You have successfully registered for the hackathon.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message,
      });
    },
  });

  const withdrawRegistration = useMutation({
    mutationFn: async (hackathonId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("hackathon_registrations")
        .delete()
        .eq("hackathon_id", hackathonId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hackathons"] });
      queryClient.invalidateQueries({ queryKey: ["hackathon-registrations"] });
      toast({
        title: "Withdrawn",
        description: "You have withdrawn from the hackathon.",
      });
    },
  });

  const verifyHackathon = useMutation({
    mutationFn: async (hackathonId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("hackathons")
        .update({ is_verified: true, verified_by: user.id })
        .eq("id", hackathonId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hackathons"] });
      toast({
        title: "Hackathon verified",
        description: "The hackathon is now visible to all users.",
      });
    },
  });

  return {
    hackathons: (hackathons && hackathons.length > 0)
      ? hackathons
      : (mockHackathons as unknown as Hackathon[]),
    myRegistrations: myRegistrations || [],
    isLoading,
    loadingRegistrations,
    error,
    refetch,
    createHackathon,
    registerForHackathon,
    withdrawRegistration,
    verifyHackathon,
  };
}
