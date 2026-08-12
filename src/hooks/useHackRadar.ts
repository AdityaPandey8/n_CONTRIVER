import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface HackRadarListing {
  id: string;
  title: string;
  description: string;
  organizer: string;
  status: string;
  prize: string | null;
  prize_pool_inr: number | null;
  prize_pool_text: string | null;
  start_date: string;
  end_date: string;
  registration_deadline: string | null;
  location: string | null;
  city: string | null;
  mode: string;
  themes: string[];
  tags: string[];
  difficulty: string | null;
  team_size_min: number | null;
  team_size_max: number | null;
  is_student_only: boolean | null;
  is_beginner_friendly: boolean | null;
  allows_solo: boolean | null;
  registration_url: string | null;
  external_url: string | null;
  source_slug: string;
  image_url: string | null;
  saves_count: number | null;
  popularity_score: number | null;
  is_verified: boolean;
  is_saved?: boolean;
  is_registered?: boolean;
}

export interface HackRadarFilters {
  q?: string;
  themes?: string[];
  mode?: "any" | "online" | "offline" | "hybrid";
  city?: string;
  minPrize?: number;
  deadlineWithinDays?: number;
  beginnerOnly?: boolean;
  studentOnly?: boolean;
  soloAllowed?: boolean;
  sources?: string[];
  sort?: "trending" | "deadline" | "prize" | "newest";
}

export function useHackRadar(filters: HackRadarFilters = {}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const listings = useQuery({
    queryKey: ["hackradar", "listings", filters],
    queryFn: async () => {
      let q = supabase
        .from("hackathons")
        .select("*")
        .neq("status", "completed");

      if (filters.q) {
        q = q.or(
          `title.ilike.%${filters.q}%,description.ilike.%${filters.q}%,organizer.ilike.%${filters.q}%`
        );
      }
      if (filters.themes?.length) q = q.overlaps("themes", filters.themes);
      if (filters.mode && filters.mode !== "any") q = q.eq("mode", filters.mode);
      if (filters.city) q = q.ilike("city", `%${filters.city}%`);
      if (filters.minPrize) q = q.gte("prize_pool_inr", filters.minPrize);
      if (filters.beginnerOnly) q = q.eq("is_beginner_friendly", true);
      if (filters.studentOnly) q = q.eq("is_student_only", true);
      if (filters.soloAllowed) q = q.eq("allows_solo", true);
      if (filters.sources?.length) q = q.in("source_slug", filters.sources);
      if (filters.deadlineWithinDays) {
        const end = new Date(
          Date.now() + filters.deadlineWithinDays * 86400_000
        ).toISOString();
        q = q.lte("registration_deadline", end).gte("registration_deadline", new Date().toISOString());
      }

      const sort = filters.sort || "trending";
      if (sort === "trending") q = q.order("popularity_score", { ascending: false, nullsFirst: false }).order("saves_count", { ascending: false, nullsFirst: false });
      else if (sort === "deadline") q = q.order("registration_deadline", { ascending: true, nullsFirst: false });
      else if (sort === "prize") q = q.order("prize_pool_inr", { ascending: false, nullsFirst: false });
      else q = q.order("first_seen_at", { ascending: false, nullsFirst: false });

      const { data, error } = await q.limit(120);
      if (error) throw error;

      let saved = new Set<string>();
      let registered = new Set<string>();
      if (user && data && data.length) {
        const ids = data.map((d: any) => d.id);
        const [{ data: s }, { data: r }] = await Promise.all([
          supabase.from("hackathon_saves").select("hackathon_id").eq("user_id", user.id).in("hackathon_id", ids),
          supabase.from("hackathon_registrations").select("hackathon_id").eq("user_id", user.id).in("hackathon_id", ids),
        ]);
        s?.forEach((x: any) => saved.add(x.hackathon_id));
        r?.forEach((x: any) => registered.add(x.hackathon_id));
      }

      return (data || []).map((h: any) => ({
        ...h,
        is_saved: saved.has(h.id),
        is_registered: registered.has(h.id),
      })) as HackRadarListing[];
    },
  });

  const savedIds = useQuery({
    queryKey: ["hackradar", "saved", user?.id],
    queryFn: async () => {
      if (!user) return [] as string[];
      const { data, error } = await supabase
        .from("hackathon_saves")
        .select("hackathon_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []).map((r: any) => r.hackathon_id as string);
    },
    enabled: !!user,
  });

  const toggleSave = useMutation({
    mutationFn: async ({ id, save }: { id: string; save: boolean }) => {
      if (!user) throw new Error("Sign in to save hackathons");
      if (save) {
        const { error } = await supabase.from("hackathon_saves").insert({ user_id: user.id, hackathon_id: id });
        if (error && !String(error.message).includes("duplicate")) throw error;
      } else {
        const { error } = await supabase.from("hackathon_saves").delete().eq("user_id", user.id).eq("hackathon_id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hackradar"] });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Couldn't update", description: e.message }),
  });

  const prefs = useQuery({
    queryKey: ["hackradar", "prefs", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("hackradar_preferences").select("*").eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const savePrefs = useMutation({
    mutationFn: async (patch: Record<string, any>) => {
      if (!user) throw new Error("Sign in required");
      const { error } = await supabase.from("hackradar_preferences").upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hackradar", "prefs"] });
      toast({ title: "Preferences saved" });
    },
  });

  return { listings, savedIds, toggleSave, prefs, savePrefs };
}

export function useHackRadarStats() {
  return useQuery({
    queryKey: ["hackradar", "stats"],
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const weekIso = new Date(Date.now() + 7 * 86400_000).toISOString();
      const [active, closing, prizeAgg] = await Promise.all([
        supabase.from("hackathons").select("id", { count: "exact", head: true }).in("status", ["upcoming", "live"]),
        supabase.from("hackathons").select("id", { count: "exact", head: true })
          .gte("registration_deadline", nowIso).lte("registration_deadline", weekIso),
        supabase.from("hackathons").select("prize_pool_inr").in("status", ["upcoming", "live"]).not("prize_pool_inr", "is", null).limit(1000),
      ]);
      const totalPrize = (prizeAgg.data || []).reduce((a: number, r: any) => a + (r.prize_pool_inr || 0), 0);
      return {
        active: active.count || 0,
        closingThisWeek: closing.count || 0,
        totalPrizeInr: totalPrize,
      };
    },
  });
}