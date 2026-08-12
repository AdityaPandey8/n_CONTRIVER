import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart } from "lucide-react";
import { mockInvestorPortfolio } from "@/data/mockData";

export default function InvestorPortfolio() {
  const totalInvested = mockInvestorPortfolio.reduce((s, p) => s + p.invested, 0);
  const totalValue = mockInvestorPortfolio.reduce((s, p) => s + p.valuation * (p.equity / 100), 0);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><PieChart className="h-6 w-6 text-primary" />Portfolio</h1>
        <p className="text-muted-foreground text-sm">Track your investments and ROI</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground uppercase">Total Invested</p><p className="text-2xl font-bold mt-1">${(totalInvested/1000).toFixed(0)}k</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground uppercase">Current Value</p><p className="text-2xl font-bold mt-1 text-emerald-600">${(totalValue/1000).toFixed(0)}k</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground uppercase">Active Companies</p><p className="text-2xl font-bold mt-1">{mockInvestorPortfolio.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Holdings</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockInvestorPortfolio.map(p => (
              <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">{p.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{p.name} <Badge variant="outline" className="text-[10px] ml-1">Demo</Badge></p>
                  <p className="text-xs text-muted-foreground">${(p.invested/1000).toFixed(0)}k invested • {p.equity}% equity</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-emerald-600">+{p.roi}% ROI</p>
                  <p className="text-xs text-muted-foreground">${(p.valuation/1_000_000).toFixed(1)}M val • {p.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}