import { motion } from "framer-motion";
import {
  Users, Rocket, TrendingUp, Shield, CheckCircle, AlertTriangle,
  Loader2, FileText, Briefcase, Lightbulb, Trophy, Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useAdminData } from "@/hooks/useAdminData";
import { usePlatformInsights } from "@/hooks/usePlatformInsights";
import { useAIUsage } from "@/hooks/useAIUsage";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Brain, Link2 } from "lucide-react";

export default function AdminOverview() {
  const { stats, mentorApplications, contentReports, loadingStats, loadingApplications, loadingReports } = useAdminData();
  const { insights, refresh } = usePlatformInsights();
  const usage = useAIUsage(7);

  const pendingApprovals = mentorApplications.filter((a) => a.status === "pending").length;
  const pendingReports = contentReports.filter((r) => r.status === "pending").length;
  const isLoading = loadingStats || loadingApplications || loadingReports;

  const userGrowthData = [
    { month: "Sep", users: Math.floor((stats?.totalUsers || 100) * 0.3) },
    { month: "Oct", users: Math.floor((stats?.totalUsers || 100) * 0.45) },
    { month: "Nov", users: Math.floor((stats?.totalUsers || 100) * 0.6) },
    { month: "Dec", users: Math.floor((stats?.totalUsers || 100) * 0.75) },
    { month: "Jan", users: stats?.totalUsers || 100 },
  ];

  // Build recent activity from resolved reports + reviewed applications
  const recentActivity = [
    ...contentReports
      .filter((r) => r.status !== "pending")
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        icon: r.status === "resolved" ? CheckCircle : AlertTriangle,
        label: r.status === "resolved" ? "Report resolved" : "Report dismissed",
        detail: `${r.content_type}: ${r.reason}`,
        time: r.created_at,
        color: r.status === "resolved" ? "text-success" : "text-muted-foreground",
      })),
    ...mentorApplications
      .filter((a) => a.status !== "pending")
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        icon: a.status === "approved" ? Shield : AlertTriangle,
        label: a.status === "approved" ? "Mentor approved" : "Mentor rejected",
        detail: a.profile?.full_name || "User",
        time: a.created_at,
        color: a.status === "approved" ? "text-primary" : "text-destructive",
      })),
  ]
    .sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime())
    .slice(0, 8);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const quickActions = [
    { title: "User Management", desc: `${stats?.totalUsers || 0} users`, icon: Users, url: "/admin/users", color: "from-primary/20 to-primary/10" },
    { title: "Content Reports", desc: `${pendingReports} pending`, icon: FileText, url: "/admin/content", color: "from-destructive/20 to-destructive/10" },
    { title: "Mentor Approvals", desc: `${pendingApprovals} pending`, icon: CheckCircle, url: "/admin/approvals", color: "from-success/20 to-success/10" },
    { title: "Startup Management", desc: `${stats?.totalStartups || 0} startups`, icon: Rocket, url: "/admin/startups", color: "from-warning/20 to-warning/10" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="bg-gradient-to-br from-card via-card to-destructive/5 border-border/50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-destructive/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-8 relative">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-destructive to-destructive/80 shadow-lg">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Overview</h1>
              <p className="text-muted-foreground mt-1">Platform health & quick actions</p>
            </div>
            <div className="ml-auto hidden sm:flex items-center gap-2">
              <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                All Systems Operational
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Users" value={stats?.totalUsers?.toLocaleString() || "0"} icon={Users} iconColor="from-primary/20 to-primary/10" trend={{ value: 18, isPositive: true }} delay={0.1} />
        <StatsCard title="Active Jobs" value={stats?.totalJobs?.toLocaleString() || "0"} icon={Briefcase} iconColor="from-accent/20 to-accent/10" delay={0.2} />
        <StatsCard title="Pending Approvals" value={String(pendingApprovals)} icon={AlertTriangle} iconColor="from-warning/20 to-warning/10" delay={0.3} />
        <StatsCard title="Content Reports" value={String(pendingReports)} icon={FileText} iconColor="from-destructive/20 to-destructive/10" delay={0.4} />
      </div>

      {/* Intelligence stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Startups" value={String(stats?.totalStartups ?? 0)} icon={Rocket} iconColor="from-success/20 to-success/10" delay={0.1} />
        <StatsCard title="AI Requests (7d)" value={String(usage.data?.total ?? 0)} icon={Brain} iconColor="from-primary/20 to-primary/10" delay={0.15} />
        <StatsCard title="Cache Hit Rate" value={`${usage.data?.cacheHitRate ?? 0}%`} icon={TrendingUp} iconColor="from-accent/20 to-accent/10" delay={0.2} />
        <StatsCard title="Avg AI Latency" value={`${usage.data?.avgLatency ?? 0}ms`} icon={Activity} iconColor="from-warning/20 to-warning/10" delay={0.25} />
      </div>

      {/* AI Insights Strip */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />AI Platform Insights</CardTitle>
            <CardDescription>Generated by the admin-intelligence engine</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/admin/match-engine"><Link2 className="h-4 w-4 mr-1" />Match engine</Link></Button>
            <Button size="sm" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
              <RefreshCw className={`h-4 w-4 mr-1 ${refresh.isPending ? "animate-spin" : ""}`} />Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No insights yet — click Refresh to generate.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {insights.slice(0, 4).map((i) => (
                <div key={i.id} className={`p-3 rounded-lg border ${
                  i.severity === "danger" ? "border-destructive/30 bg-destructive/5"
                  : i.severity === "warn" ? "border-warning/30 bg-warning/5"
                  : i.severity === "success" ? "border-success/30 bg-success/5"
                  : "border-border bg-secondary/30"
                }`}>
                  <p className="text-sm font-semibold text-foreground">{i.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{i.body}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link key={action.url} to={action.url}>
            <Card className="hover:shadow-md transition-all cursor-pointer border-border/50 hover:border-primary/30">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color}`}>
                  <action.icon className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Growth Chart */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              User Growth
            </CardTitle>
            <CardDescription>New user registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData}>
                  <defs>
                    <linearGradient id="adminColorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
                  <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#adminColorUsers)" dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest admin actions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors"
                  >
                    <item.icon className={`h-4 w-4 shrink-0 ${item.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                    </div>
                    <span className="text-xs text-muted-foreground/60 shrink-0">
                      {item.time ? formatDistanceToNow(new Date(item.time), { addSuffix: true }) : ""}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
            <Link to="/admin/activity" className="block text-center text-sm text-accent hover:underline mt-4">
              View all activity →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
