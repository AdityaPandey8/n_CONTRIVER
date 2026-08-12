import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  TrendingUp, Eye, Calendar, Briefcase, Target, Sparkles, ArrowRight,
  Bookmark, MessageSquare, Compass, BarChart3, PieChart, Star, Shield, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useAuth } from "@/contexts/AuthContext";
import { useStartups } from "@/hooks/useStartups";
import {
  mockInvestorStats,
  mockInvestorRecommended,
  mockInvestorTrending,
  mockInvestorPipeline,
  mockInvestorPortfolio,
} from "@/data/mockData";

const riskColor = (r: string) =>
  r === "Low" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  : r === "Medium" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
  : "bg-rose-500/10 text-rose-600 dark:text-rose-400";

export default function InvestorDashboard() {
  const { profile } = useAuth();
  const { startups } = useStartups();
  const realStartups = startups.filter(s => !s.id.startsWith("demo_")).slice(0, 6);
  const recommended = realStartups.length >= 3
    ? realStartups.map(s => ({
        id: s.id, name: s.name, tagline: s.tagline || "", industry: s.industry,
        stage: s.stage, funding_ask: s.investment_amount_sought ? `$${(s.investment_amount_sought/1000).toFixed(0)}k` : "TBD",
        ai_score: 70 + Math.floor(Math.random() * 25), risk: "Medium", match: 80,
        founders: s.founder?.full_name || "—", traction: "Live data", logo: s.logo_url,
      }))
    : mockInvestorRecommended;

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-border/50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-8 relative">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                  {greeting()}, {profile?.full_name?.split(" ")[0] || "Investor"} 💼
                </h1>
                <p className="text-lg text-muted-foreground">
                  Your Bloomberg-style command center for startup investing.
                </p>
              </div>
              <div className="flex gap-3">
                <Button asChild variant="outline"><Link to="/dashboard/investor/insights"><BarChart3 className="mr-2 h-4 w-4" />Insights</Link></Button>
                <Button asChild className="gradient-primary text-primary-foreground shadow-lg">
                  <Link to="/dashboard/investor/discover"><Compass className="mr-2 h-5 w-5" />Discover Startups</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Deals Viewed" value={mockInvestorStats.dealsViewed} icon={Eye} iconColor="from-blue-500/20 to-blue-500/10" delay={0.05} />
        <StatsCard title="Meetings Scheduled" value={mockInvestorStats.meetingsScheduled} icon={Calendar} iconColor="from-violet-500/20 to-violet-500/10" delay={0.1} />
        <StatsCard title="Active Investments" value={mockInvestorStats.activeInvestments} icon={Briefcase} iconColor="from-emerald-500/20 to-emerald-500/10" delay={0.15} />
        <StatsCard title="Conversion Rate" value={`${mockInvestorStats.conversionRate}%`} icon={Target} iconColor="from-amber-500/20 to-amber-500/10" delay={0.2} />
      </div>

      {/* AI-Recommended */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />AI-Recommended Startups</CardTitle>
              <CardDescription>Curated for your thesis & portfolio gaps</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm"><Link to="/dashboard/investor/discover">View All<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommended.slice(0, 6).map((s) => (
                <div key={s.id} className="group p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-secondary/40 hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {s.name.charAt(0)}
                    </div>
                    {s.id.startsWith("demo_") && <Badge variant="outline" className="text-[10px]">Demo</Badge>}
                  </div>
                  <p className="font-semibold text-sm text-foreground line-clamp-1">{s.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 mb-3">{s.tagline}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="secondary" className="text-[10px]">{s.industry}</Badge>
                    <Badge variant="outline" className="text-[10px]">{s.stage}</Badge>
                    <Badge className={`text-[10px] ${riskColor(s.risk)}`} variant="secondary">
                      <Shield className="h-2.5 w-2.5 mr-0.5" />{s.risk} Risk
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-secondary/40 p-2">
                      <p className="text-muted-foreground text-[10px] uppercase tracking-wide">AI Score</p>
                      <p className="font-bold text-primary flex items-center gap-1"><Zap className="h-3 w-3" />{s.ai_score}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/40 p-2">
                      <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Match</p>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">{s.match}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Asking: <span className="font-medium text-foreground">{s.funding_ask}</span></p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Trending + Pipeline preview */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Trending This Week</CardTitle>
              <CardDescription>Fastest-rising startups</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockInvestorTrending.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div>
                  <p className="font-medium text-sm">{t.name} <Badge variant="outline" className="text-[10px] ml-1">Demo</Badge></p>
                  <p className="text-xs text-muted-foreground">{t.industry}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{t.growth}</p>
                  <p className="text-xs text-muted-foreground">AI {t.ai_score}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Deal Pipeline</CardTitle>
              <CardDescription>Snapshot across stages</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm"><Link to="/dashboard/investor/pipeline">Open<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2 text-center">
              {Object.entries(mockInvestorPipeline).map(([stage, items]) => (
                <div key={stage} className="rounded-lg bg-secondary/30 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{stage}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{(items as any[]).length}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio preview */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5 text-primary" />Portfolio</CardTitle>
            <CardDescription>ROI across active investments</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm"><Link to="/dashboard/investor/portfolio">View All<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockInvestorPortfolio.map(p => (
              <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">{p.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{p.name} <Badge variant="outline" className="text-[10px] ml-1">Demo</Badge></p>
                  <p className="text-xs text-muted-foreground">Invested ${(p.invested/1000).toFixed(0)}k • {p.equity}% equity</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${p.roi >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>+{p.roi}% ROI</p>
                  <p className="text-xs text-muted-foreground">${(p.valuation/1_000_000).toFixed(1)}M val</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-4">
        <QuickLink to="/dashboard/investor/watchlist" icon={Bookmark} title="Watchlist" desc="Saved startups" />
        <QuickLink to="/dashboard/messages" icon={MessageSquare} title="Conversations" desc={`${mockInvestorStats.unreadMessages} unread`} />
        <QuickLink to="/dashboard/investor/insights" icon={TrendingUp} title="Market Insights" desc="Trends & funding" />
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, title, desc }: { to: string; icon: any; title: string; desc: string }) {
  return (
    <Link to={to} className="group p-5 rounded-xl border border-border/50 bg-card/60 hover:bg-secondary/40 hover:border-primary/30 transition-all flex items-center gap-4">
      <div className="p-3 rounded-xl bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
      <div className="flex-1">
        <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}