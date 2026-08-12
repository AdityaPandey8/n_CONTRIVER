import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Compass, Shield, Zap } from "lucide-react";
import { useStartups } from "@/hooks/useStartups";
import { mockInvestorRecommended } from "@/data/mockData";

export default function InvestorDiscover() {
  const { startups } = useStartups();
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("all");
  const [stage, setStage] = useState("all");

  const real = startups.filter(s => !s.id.startsWith("demo_"));
  const list = real.length > 0
    ? real.map(s => ({
        id: s.id, name: s.name, tagline: s.tagline || "", industry: s.industry, stage: s.stage,
        funding_ask: s.investment_amount_sought ? `$${s.investment_amount_sought/1000}k` : "TBD",
        ai_score: 75, risk: "Medium", match: 80,
      }))
    : mockInvestorRecommended;

  const filtered = list.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (industry !== "all" && s.industry !== industry) return false;
    if (stage !== "all" && (s.stage || "").toLowerCase() !== stage.toLowerCase()) return false;
    return true;
  });

  const industries = [...new Set(list.map(s => s.industry))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Compass className="h-6 w-6 text-primary" />Discover Startups</h1>
        <p className="text-muted-foreground text-sm">AI-curated deal flow with validation scores</p>
      </div>

      <Card><CardContent className="p-4 flex flex-col md:flex-row gap-3">
        <Input placeholder="Search startups…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Industry" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All industries</SelectItem>
            {industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            <SelectItem value="idea">Idea</SelectItem>
            <SelectItem value="mvp">MVP</SelectItem>
            <SelectItem value="revenue">Revenue</SelectItem>
            <SelectItem value="scaling">Scaling</SelectItem>
          </SelectContent>
        </Select>
      </CardContent></Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <Card key={s.id} className="hover:border-primary/30 transition-all">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">{s.name.charAt(0)}</div>
                {s.id.startsWith("demo_") && <Badge variant="outline" className="text-[10px]">Demo</Badge>}
              </div>
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{s.tagline}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-[10px]">{s.industry}</Badge>
                <Badge variant="outline" className="text-[10px] capitalize">{s.stage}</Badge>
                <Badge variant="secondary" className="text-[10px]"><Shield className="h-2.5 w-2.5 mr-0.5" />{s.risk}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded bg-secondary/40 p-2"><p className="text-muted-foreground text-[10px]">AI Score</p><p className="font-bold text-primary"><Zap className="inline h-3 w-3 mr-0.5" />{s.ai_score}</p></div>
                <div className="rounded bg-secondary/40 p-2"><p className="text-muted-foreground text-[10px]">Match</p><p className="font-bold text-emerald-600">{s.match}%</p></div>
              </div>
              <p className="text-xs text-muted-foreground">Asking <span className="font-medium text-foreground">{s.funding_ask}</span></p>
              <Button asChild size="sm" className="w-full">
                <Link to={s.id.startsWith("demo_") ? "/dashboard/investor-connect" : `/dashboard/startup/${s.id}`}>View Details</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center text-muted-foreground py-12">No startups match your filters.</div>}
      </div>
    </div>
  );
}