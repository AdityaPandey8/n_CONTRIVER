import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";
import { mockInvestorPipeline } from "@/data/mockData";

const STAGE_LABELS: Record<string, string> = {
  Discovered: "Discovered", Interested: "Interested", Meeting: "Meeting Scheduled",
  DueDiligence: "Due Diligence", Invested: "Invested",
};

export default function InvestorPipeline() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" />Deal Pipeline</h1>
        <p className="text-muted-foreground text-sm">CRM-style tracker for every opportunity</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {Object.entries(mockInvestorPipeline).map(([stage, items]) => (
          <div key={stage} className="rounded-xl bg-secondary/30 p-3 space-y-2 min-h-[200px]">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold px-1">{STAGE_LABELS[stage]} <span className="text-foreground">({(items as any[]).length})</span></p>
            {(items as any[]).map(it => (
              <Card key={it.id} className="bg-card/80"><CardContent className="p-3 space-y-1">
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-sm">{it.name}</p>
                  <Badge variant="outline" className="text-[10px]">Demo</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{it.stage} • {it.ask}</p>
                <p className="text-xs"><span className="font-bold text-primary">AI {it.score}</span></p>
              </CardContent></Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}