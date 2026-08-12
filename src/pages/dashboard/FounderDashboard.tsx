import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Rocket, DollarSign, Users, BarChart3, ClipboardList, ArrowRight, Sparkles, TrendingUp, Heart, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useAuth } from "@/contexts/AuthContext";
import {
  mockFounderStats, mockFounderHealth, mockFounderInvestorInterest, mockFounderFundraising,
  mockFounderRoles, mockFounderApplicants, mockFounderTasks,
} from "@/data/mockData";

export default function FounderDashboard() {
  const { profile } = useAuth();
  const fr = mockFounderFundraising;
  const raisedPct = Math.round((fr.raised / fr.target) * 100);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-border/50 overflow-hidden relative">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold">Welcome, {profile?.full_name?.split(" ")[0] || "Founder"} 🚀</h1>
                <p className="text-lg text-muted-foreground">Your startup command center.</p>
              </div>
              <div className="flex gap-3">
                <Button asChild variant="outline"><Link to="/dashboard/pitch-deck"><Sparkles className="mr-2 h-4 w-4" />Pitch Deck</Link></Button>
                <Button asChild className="gradient-primary text-primary-foreground"><Link to="/dashboard/founder/fundraising"><DollarSign className="mr-2 h-4 w-4" />Fundraising</Link></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Users" value={mockFounderStats.users.toLocaleString()} icon={Users} delay={0.05} />
        <StatsCard title="MRR" value={`$${(mockFounderStats.monthlyRevenue/1000).toFixed(1)}k`} icon={DollarSign} delay={0.1} />
        <StatsCard title="Growth" value={`+${mockFounderStats.growthRate}%`} icon={TrendingUp} delay={0.15} />
        <StatsCard title="Investor Views" value={mockFounderStats.investorViews} icon={Activity} delay={0.2} />
      </div>

      {/* Startup Health */}
      <Card className="bg-gradient-to-br from-card to-primary/5">
        <CardHeader><CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-rose-500" />Startup Health Score</CardTitle><CardDescription>AI assessment across key dimensions</CardDescription></CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex flex-col items-center justify-center min-w-[160px]">
              <div className="text-6xl font-bold text-primary">{mockFounderHealth.overall}</div>
              <p className="text-sm text-muted-foreground">/ 100</p>
              <Badge variant="secondary" className="mt-2">Demo</Badge>
            </div>
            <div className="flex-1 space-y-3">
              {mockFounderHealth.breakdown.map(b => (
                <div key={b.dimension}><div className="flex justify-between text-sm mb-1"><span>{b.dimension}</span><span className="font-semibold">{b.score}</span></div><Progress value={b.score} className="h-1.5" /></div>
              ))}
            </div>
          </div>
          <div className="mt-5 space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">AI Suggestions</p>
            <ul className="text-sm space-y-1">{mockFounderHealth.suggestions.map((s, i) => <li key={i} className="flex gap-2"><Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />{s}</li>)}</ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Fundraising */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" />Fundraising</CardTitle><CardDescription>{fr.stage} round</CardDescription></div>
            <Button asChild variant="ghost" size="sm"><Link to="/dashboard/founder/fundraising">Open<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div><div className="flex justify-between text-sm mb-1"><span>${(fr.raised/1000).toFixed(0)}k raised</span><span className="text-muted-foreground">${(fr.target/1000).toFixed(0)}k target</span></div><Progress value={raisedPct} className="h-2" /></div>
            <div className="space-y-2">
              {mockFounderInvestorInterest.slice(0, 3).map(i => (
                <div key={i.id} className="flex justify-between items-center p-2 rounded bg-secondary/30">
                  <div><p className="text-sm font-medium">{i.name} <Badge variant="outline" className="text-[10px] ml-1">Demo</Badge></p><p className="text-xs text-muted-foreground">{i.firm}</p></div>
                  <div className="text-right"><p className="text-xs font-bold text-primary">{i.match}% match</p><p className="text-xs text-muted-foreground">{i.status}</p></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Team Builder</CardTitle><CardDescription>Open roles & applicants</CardDescription></div>
            <Button asChild variant="ghost" size="sm"><Link to="/dashboard/founder/team">Open<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockFounderRoles.map(r => (
              <div key={r.id} className="flex justify-between p-2 rounded bg-secondary/30 text-sm">
                <span>{r.title} <Badge variant="outline" className="text-[10px] ml-1">Demo</Badge></span>
                <span className="text-muted-foreground">{r.applicants} applicants • {r.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />Tasks & Milestones</CardTitle><CardDescription>{mockFounderStats.openTasks} open</CardDescription></div>
          <Button asChild variant="ghost" size="sm"><Link to="/dashboard/founder/tasks">View All<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {mockFounderTasks.slice(0, 4).map(t => (
            <div key={t.id} className="flex justify-between items-center p-2 rounded bg-secondary/30 text-sm">
              <div><span>{t.title} <Badge variant="outline" className="text-[10px] ml-1">Demo</Badge></span><p className="text-xs text-muted-foreground">{t.priority} • Due {t.dueDate}</p></div>
              <Badge variant={t.status === "in_progress" ? "default" : "secondary"} className="text-[10px]">{t.status.replace("_", " ")}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}