import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { useIdeaEvolution } from "@/hooks/useIdeaIntelligence";
import { Skeleton } from "@/components/ui/skeleton";

export function IdeaEvolutionTimeline({ workspaceId }: { workspaceId: string }) {
  const { data, isLoading } = useIdeaEvolution(workspaceId);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  const versions = data?.versions ?? [];
  const comparison = data?.comparison;

  if (versions.length === 0) {
    return (
      <Card className="bg-card/80 border-border/50">
        <CardContent className="py-12 text-center text-muted-foreground">
          No versions yet. Run validation to create version 1.
        </CardContent>
      </Card>
    );
  }

  const latest = versions[versions.length - 1];
  const first = versions[0];
  const delta = latest.score - first.score;

  return (
    <div className="space-y-4">
      <Card className="bg-card/80 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />Idea Evolution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl font-bold">{latest.score}</div>
            <div className="flex items-center gap-1 text-sm">
              {delta >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
              <span className={delta >= 0 ? "text-green-500" : "text-red-500"}>
                {delta >= 0 ? "+" : ""}{delta} since v{first.version}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {versions.map((v: any, i: number) => {
              const prev = i > 0 ? versions[i - 1] : null;
              const d = prev ? v.score - prev.score : 0;
              return (
                <div key={v.id} className="flex items-center justify-between p-2 rounded border border-border/50">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">v{v.version}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(v.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span>Score <b>{v.score}</b></span>
                    <span>Confidence <b>{v.confidence}%</b></span>
                    <Badge variant="secondary" className="capitalize">{v.risk}</Badge>
                    {prev && (
                      <span className={d >= 0 ? "text-green-500" : "text-red-500"}>
                        {d >= 0 ? "+" : ""}{d}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {comparison && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-green-500/5 border-green-500/30">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-green-500">Improvements</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {(comparison.improvements ?? []).map((s: string, i: number) => (
                  <li key={i} className="flex gap-2"><ArrowRight className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />{s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500/5 border-yellow-500/30">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-yellow-500">Still weak</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {(comparison.weaknesses ?? []).map((s: string, i: number) => (
                  <li key={i} className="flex gap-2"><ArrowRight className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />{s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
