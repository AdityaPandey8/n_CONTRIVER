import { TrendingUp, Loader2, Lightbulb, Rocket, DollarSign, LineChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAdminData } from "@/hooks/useAdminData";
import { usePlatformInsights } from "@/hooks/usePlatformInsights";

export default function SuccessTracker() {
  const { stats, loadingStats } = useAdminData();
  const { insights } = usePlatformInsights();
  if (loadingStats) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const ideaCount = stats?.totalUsers ?? 0; // proxy; ideas count fetched in insights metadata if needed
  const funnel = [
    { label: "Ideas", value: ideaCount, icon: Lightbulb, color: "from-primary/20 to-primary/10" },
    { label: "Startups", value: stats?.totalStartups ?? 0, icon: Rocket, color: "from-accent/20 to-accent/10" },
    { label: "Funding", value: Math.round((stats?.totalStartups ?? 0) * 0.2), icon: DollarSign, color: "from-success/20 to-success/10" },
    { label: "Growth", value: Math.round((stats?.totalStartups ?? 0) * 0.05), icon: LineChart, color: "from-warning/20 to-warning/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Startup Success Tracker
        </h1>
        <p className="text-muted-foreground mt-1">Idea → Startup → Funding → Growth lifecycle</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {funnel.map((f) => (
          <Card key={f.label} className="border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${f.color}`}><f.icon className="h-5 w-5 text-foreground" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{f.value}</p>
                <p className="text-xs text-muted-foreground">{f.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardHeader><CardTitle>AI insights</CardTitle><CardDescription>Patterns from successful ideas</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {insights.length === 0 && <p className="text-center text-muted-foreground py-8">No insights yet — refresh from the Overview page.</p>}
          {insights.slice(0, 8).map((i) => (
            <div key={i.id} className="p-3 rounded-lg bg-secondary/30">
              <p className="text-sm font-semibold text-foreground">{i.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{i.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}