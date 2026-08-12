import { motion } from "framer-motion";
import { 
  Users, 
  Rocket, 
  TrendingUp,
  Shield,
  CheckCircle,
  AlertTriangle,
  Activity,
  UserPlus,
  Loader2,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useAdminData } from "@/hooks/useAdminData";
import { formatDistanceToNow } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const roleColors: Record<string, string> = {
  startup: "bg-rose-500/10 text-rose-600",
  mentor: "bg-emerald-500/10 text-emerald-600",
  student: "bg-violet-500/10 text-violet-600",
  investor: "bg-amber-500/10 text-amber-600",
  innovator: "bg-blue-500/10 text-blue-600",
  admin: "bg-red-500/10 text-red-600",
};

export default function AdminDashboard() {
  const { 
    stats, 
    users,
    mentorApplications, 
    loadingStats,
    loadingUsers,
    loadingApplications,
    approveMentorApplication,
    rejectMentorApplication,
  } = useAdminData();

  const pendingMentorApplications = mentorApplications.filter(app => app.status === "pending");
  const recentUsers = users.slice(0, 5);
  const isLoading = loadingStats || loadingUsers || loadingApplications;

  // Generate mock growth data based on total users
  const userGrowthData = [
    { month: "Sep", users: Math.floor((stats?.totalUsers || 100) * 0.3) },
    { month: "Oct", users: Math.floor((stats?.totalUsers || 100) * 0.45) },
    { month: "Nov", users: Math.floor((stats?.totalUsers || 100) * 0.6) },
    { month: "Dec", users: Math.floor((stats?.totalUsers || 100) * 0.75) },
    { month: "Jan", users: stats?.totalUsers || 100 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-border/50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-8 relative">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                  Admin Dashboard
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                  Monitor platform health and manage users
                </p>
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
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers?.toLocaleString() || "0"}
          icon={Users}
          iconColor="from-violet-500/20 to-violet-500/10"
          trend={{ value: 18, isPositive: true }}
          delay={0.1}
        />
        <StatsCard
          title="Active Startups"
          value={stats?.totalStartups?.toLocaleString() || "0"}
          icon={Rocket}
          iconColor="from-rose-500/20 to-rose-500/10"
          trend={{ value: 12, isPositive: true }}
          delay={0.2}
        />
        <StatsCard
          title="Pending Approvals"
          value={pendingMentorApplications?.length?.toString() || "0"}
          icon={AlertTriangle}
          iconColor="from-amber-500/20 to-amber-500/10"
          delay={0.3}
        />
        <StatsCard
          title="Platform Health"
          value="99.9%"
          description="Uptime this month"
          icon={Activity}
          iconColor="from-emerald-500/20 to-emerald-500/10"
          delay={0.4}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="h-full bg-card/80 backdrop-blur-sm border-border/50">
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
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis 
                      dataKey="month" 
                      className="text-muted-foreground"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-muted-foreground"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.75rem",
                        boxShadow: "0 4px 12px hsl(var(--foreground) / 0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      fill="url(#colorUsers)"
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Approvals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="h-full bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Pending Mentor Applications
              </CardTitle>
              <CardDescription>Verification requests awaiting review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingMentorApplications && pendingMentorApplications.length > 0 ? (
                  pendingMentorApplications.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                            {app.profile?.full_name?.split(" ").map((n: string) => n[0]).join("") || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">{app.profile?.full_name || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">
                            {app.years_experience} years • {app.expertise_areas?.slice(0, 2).join(", ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                          onClick={() => rejectMentorApplication.mutate({ applicationId: app.id, feedback: "Application declined" })}
                          disabled={rejectMentorApplication.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                        <Button 
                          size="sm" 
                          className="gradient-accent text-accent-foreground shadow-lg shadow-accent/20"
                          onClick={() => approveMentorApplication.mutate({ applicationId: app.id })}
                          disabled={approveMentorApplication.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No pending applications</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Registrations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Recent Registrations
            </CardTitle>
            <CardDescription>Latest users who joined the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers && recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <Avatar className="h-11 w-11 ring-2 ring-border">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-medium">
                        {user.full_name?.split(" ").map((n: string) => n[0]).join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{user.full_name || "Anonymous"}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge className={`${roleColors[user.role || "student"]} border-0 capitalize font-medium`}>
                      {user.role || "student"}
                    </Badge>
                    <span className="text-sm text-muted-foreground hidden sm:block">
                      {user.created_at && formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent registrations</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
