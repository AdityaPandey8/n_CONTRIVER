import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserAIMemory {
  user_id: string;
  role: string | null;
  interests: string[];
  startup_stage: string | null;
  preferred_industry: string | null;
  memory_summary: string | null;
  updated_at: string;
  startup_name: string | null;
  startup_description: string | null;
  industry: string | null;
  target_users: string | null;
  goals: string[];
  preferred_ai_style: string | null;
}

export function useUserMemory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-ai-memory", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<UserAIMemory | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_ai_memory" as never)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) {
        console.warn("user_ai_memory read failed", error);
        return null;
      }
      return (data as UserAIMemory | null) ?? null;
    },
  });
}