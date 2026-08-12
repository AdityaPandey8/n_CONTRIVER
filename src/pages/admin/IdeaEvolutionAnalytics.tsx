import { GitBranch, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function IdeaEvolutionAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ["idea_versions", "platform"],
    queryFn: async () => {
      const { data } = await supabase
        .from("idea_versions")
        .select("workspace_id, version, score, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  if (isLoading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const byWorkspace: Record<string, { first: number; last: number }> = {};
  (data ?? []).forEach((v) => {
    const k = v.workspace_id;
    if (!byWorkspace[k]) byWorkspace[k] = { first: v.score, last: v.score };
    byWorkspace[k].first = v.score; // older overwrites since DESC
  });
  const improvements = Object.entries(byWorkspace)
    .map(([id, b]) => ({ id, delta: b.last - b.first }))
    .sort((a, b) => b.delta - a.delta);
  const avgDelta = improvements.length ? Math.round(improvements.reduce((s, x) => s + x.delta, 0) / improvements.length) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><GitBranch className="h-6 w-6 text-primary" />Idea Evolution Analytics</h1>
        <p className="text-muted-foreground mt-1">How ideas evolve across versions, platform-wide</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50"><CardContent className="p-5">
          <p className="text-xs text-muted-foreground">Versions tracked</p>
          <p className="text-3xl font-bold text-foreground">{data?.length ?? 0}</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-5">
          <p className="text-xs text-muted-foreground">Workspaces evolving</p>
          <p className="text-3xl font-bold text-foreground">{Object.keys(byWorkspace).length}</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-5">
          <p className="text-xs text-muted-foreground">Avg score Δ</p>
          <p className="text-3xl font-bold text-success">{avgDelta >= 0 ? "+" : ""}{avgDelta}</p>
        </CardContent></Card>
      </div>
      <Card className="border-border/50">
        <CardHeader><CardTitle>Most improved ideas</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {improvements.slice(0, 15).map((i) => (
              <div key={i.id} className="flex items-center justify-between py-2.5">
                <code className="text-xs text-muted-foreground">{i.id.slice(0, 12)}</code>
                <span className={`font-semibold ${i.delta >= 0 ? "text-success" : "text-destructive"}`}>{i.delta >= 0 ? "+" : ""}{i.delta}</span>
              </div>
            ))}
            {improvements.length === 0 && <p className="text-center text-muted-foreground py-8">No version data yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}