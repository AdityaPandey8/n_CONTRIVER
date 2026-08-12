import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { mockInvestorInsights } from "@/data/mockData";

export default function InvestorInsights() {
  const max = Math.max(...mockInvestorInsights.fundingTrends.map(t => t.seriesA));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary" />Market Insights</h1>
        <p className="text-muted-foreground text-sm">Trends, funding flows, and sector momentum</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Trending Industries</CardTitle><CardDescription>YoY growth signal</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {mockInvestorInsights.trendingIndustries.map(i => (
            <div key={i.name}>
              <div className="flex justify-between text-sm mb-1"><span>{i.name}</span><span className="font-semibold text-emerald-600">+{i.growth}%</span></div>
              <Progress value={i.growth * 2} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Funding Trends</CardTitle><CardDescription>Avg ticket size by quarter ($M)</CardDescription></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {mockInvestorInsights.fundingTrends.map(t => (
              <div key={t.quarter} className="rounded-lg bg-secondary/30 p-3 text-center">
                <p className="text-xs text-muted-foreground">{t.quarter}</p>
                <div className="mt-2 space-y-1">
                  <div className="h-20 flex flex-col justify-end gap-1">
                    <div className="bg-primary rounded-t" style={{ height: `${(t.seriesA/max)*100}%` }} />
                    <div className="bg-accent/60 rounded-t" style={{ height: `${(t.seed/max)*100}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">A ${t.seriesA}M • Seed ${t.seed}M</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}