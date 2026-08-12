import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bookmark } from "lucide-react";
import { mockInvestorRecommended } from "@/data/mockData";

export default function InvestorWatchlist() {
  // Real data: future — query startup_interests where interest_type='watching'
  const items = mockInvestorRecommended.slice(0, 4);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Bookmark className="h-6 w-6 text-primary" />Watchlist</h1>
        <p className="text-muted-foreground text-sm">Startups you're keeping an eye on</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(s => (
          <Card key={s.id}><CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-start">
              <p className="font-semibold">{s.name}</p>
              <Badge variant="outline" className="text-[10px]">Demo</Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{s.tagline}</p>
            <div className="flex gap-2 text-xs"><Badge variant="secondary">{s.industry}</Badge><Badge variant="outline">{s.stage}</Badge></div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}