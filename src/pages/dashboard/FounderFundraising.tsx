import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { DollarSign, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { mockFounderFundraising, mockFounderInvestorInterest } from "@/data/mockData";

export default function FounderFundraising() {
  const fr = mockFounderFundraising;
  const pct = Math.round((fr.raised / fr.target) * 100);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary" />Fundraising Hub</h1><p className="text-muted-foreground text-sm">{fr.stage} round • close by {fr.closeDate}</p></div>
      <Card>
        <CardHeader><CardTitle>Round Progress</CardTitle><CardDescription>${(fr.raised/1000).toFixed(0)}k of ${(fr.target/1000).toFixed(0)}k</CardDescription></CardHeader>
        <CardContent><Progress value={pct} className="h-3" /><p className="text-xs text-muted-foreground mt-2">{pct}% committed</p></CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Interested Investors</CardTitle><Button asChild variant="outline" size="sm"><Link to="/dashboard/pitch-deck"><Sparkles className="mr-2 h-4 w-4" />Improve Pitch</Link></Button></CardHeader>
        <CardContent className="space-y-2">{mockFounderInvestorInterest.map(i => (
          <div key={i.id} className="flex justify-between items-center p-3 rounded-xl bg-secondary/30">
            <div><p className="font-medium text-sm">{i.name} <Badge variant="outline" className="text-[10px] ml-1">Demo</Badge></p><p className="text-xs text-muted-foreground">{i.firm}</p></div>
            <div className="text-right"><p className="font-bold text-primary text-sm">{i.match}% match</p><p className="text-xs text-muted-foreground">{i.status}</p></div>
          </div>
        ))}</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Commitments</CardTitle></CardHeader>
        <CardContent className="space-y-2">{fr.commitments.map((c, i) => (
          <div key={i} className="flex justify-between p-3 rounded-xl bg-secondary/30 text-sm">
            <span>{c.from}</span><span className="font-semibold">${(c.amount/1000).toFixed(0)}k <Badge variant="secondary" className="ml-2 text-[10px]">{c.status}</Badge></span>
          </div>
        ))}</CardContent>
      </Card>
    </div>
  );
}