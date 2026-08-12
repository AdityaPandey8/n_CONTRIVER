import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAIUsage(days = 7) {
  return useQuery({
    queryKey: ["ai-usage", days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
      const { data, error } = await supabase
        .from("ai_usage_log")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      const rows = data ?? [];
      const total = rows.length;
      const cacheHits = rows.filter((r) => r.cache_hit).length;
      const totalTokens = rows.reduce((s, r) => s + (r.tokens_in ?? 0) + (r.tokens_out ?? 0), 0);
      const avgLatency = total ? Math.round(rows.reduce((s, r) => s + (r.latency_ms ?? 0), 0) / total) : 0;
      const byDay: Record<string, number> = {};
      const byModule: Record<string, number> = {};
      rows.forEach((r) => {
        const day = (r.created_at as string).slice(0, 10);
        byDay[day] = (byDay[day] ?? 0) + 1;
        byModule[r.module] = (byModule[r.module] ?? 0) + 1;
      });
      return { rows, total, cacheHitRate: total ? Math.round((cacheHits / total) * 100) : 0, totalTokens, avgLatency, byDay, byModule };
    },
  });
}