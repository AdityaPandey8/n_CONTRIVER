import { useEffect, useState } from "react";
import { Link2, Loader2, RefreshCw, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAISettings } from "@/hooks/useAISettings";
import { useMatchEngine } from "@/hooks/useMatchEngine";

export default function MatchEngineControl() {
  const { settings, isLoading, update } = useAISettings();
  const { topMatches, recompute } = useMatchEngine();
  const [mentor, setMentor] = useState({ skill: 50, domain: 30, experience: 20 });
  const [investor, setInvestor] = useState({ industry: 50, stage: 30, funding: 20 });

  useEffect(() => {
    if (settings?.match_weights) {
      setMentor(settings.match_weights.mentor);
      setInvestor(settings.match_weights.investor);
    }
  }, [settings]);

  if (isLoading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const saveWeights = () =>
    update.mutate({
      match_weights: { ...(settings?.match_weights ?? { idea: { similarity_threshold: 75 } }), mentor, investor },
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Link2 className="h-6 w-6 text-primary" />
          Match Engine Control
        </h1>
        <p className="text-muted-foreground mt-1">Tune mentor/investor matching and recompute</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <WeightCard title="Mentor matching" weights={mentor} setWeights={(v) => setMentor(v as typeof mentor)} />
        <WeightCard title="Investor matching" weights={investor} setWeights={(v) => setInvestor(v as typeof investor)} />
      </div>

      <div className="flex gap-3">
        <Button onClick={saveWeights} disabled={update.isPending}>
          <Save className="h-4 w-4 mr-2" />Save weights
        </Button>
        <Button variant="outline" onClick={() => recompute.mutate("mentor")} disabled={recompute.isPending}>
          <RefreshCw className="h-4 w-4 mr-2" />Recompute mentors
        </Button>
        <Button variant="outline" onClick={() => recompute.mutate("investor")} disabled={recompute.isPending}>
          <RefreshCw className="h-4 w-4 mr-2" />Recompute investors
        </Button>
        <Button variant="outline" onClick={() => recompute.mutate("idea")} disabled={recompute.isPending}>
          <RefreshCw className="h-4 w-4 mr-2" />Recompute ideas
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Top matches</CardTitle>
          <CardDescription>Highest-scoring user ↔ target pairs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {topMatches.slice(0, 20).map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-2.5">
                <Badge variant="outline" className="capitalize">{m.target_type}</Badge>
                <code className="text-xs text-muted-foreground truncate">{m.user_id.slice(0, 8)} → {m.target_id.slice(0, 8)}</code>
                <span className="ml-auto font-semibold text-foreground">{m.score}</span>
              </div>
            ))}
            {topMatches.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No matches yet — run recompute.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WeightCard({ title, weights, setWeights }: { title: string; weights: Record<string, number>; setWeights: (v: Record<string, number>) => void }) {
  return (
    <Card className="border-border/50">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        {Object.keys(weights).map((k) => (
          <div key={k} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="capitalize text-foreground">{k}</span>
              <span className="text-muted-foreground">{weights[k]}%</span>
            </div>
            <Slider value={[weights[k]]} onValueChange={([v]) => setWeights({ ...weights, [k]: v })} max={100} step={5} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}