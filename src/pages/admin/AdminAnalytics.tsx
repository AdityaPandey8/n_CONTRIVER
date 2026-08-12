import { BarChart3, Loader2, Users, Rocket, Briefcase, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAdminData } from "@/hooks/useAdminData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const ROLE_COLORS = ["hsl(0, 72%, 51%)", "hsl(270, 60%, 50%)", "hsl(210, 70%, 50%)", "hsl(142, 72%, 35%)", "hsl(38, 92%, 50%)", "hsl(15, 90%, 55%)"];

export default function AdminAnalytics() {
  const { stats, users, loadingStats, loadingUsers } = useAdminData();

  if (loadingStats || loadingUsers) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Role distribution
  const roleCounts: Record<string, number> = {};
  users.forEach((u) => {
    const r = u.role || "student";
    roleCounts[r] = (roleCounts[r] || 0) + 1;
  });
  const roleData = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));

  // Platform metrics
  const metricsData = [
    { name: "Users", count: stats?.totalUsers || 0 },
    { name: "Mentors", count: stats?.totalMentors || 0 },
    { name: "Startups", count: stats?.totalStartups || 0 },
    { name: "Jobs", count: stats?.totalJobs || 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Platform Analytics
        </h1>
        <p className="text-muted-foreground mt-1">Insights into platform usage and growth</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Role Distribution */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Role Distribution</CardTitle>
            <CardDescription>Breakdown of user roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {roleData.map((_, i) => (
                      <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Platform Metrics */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Platform Metrics</CardTitle>
            <CardDescription>Key counts across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.75rem",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "New This Week", value: stats?.newUsersThisWeek || 0, icon: Users },
          { label: "Verified Mentors", value: stats?.totalMentors || 0, icon: Users },
          { label: "Active Startups", value: stats?.totalStartups || 0, icon: Rocket },
          { label: "Active Jobs", value: stats?.totalJobs || 0, icon: Briefcase },
        ].map((item) => (
          <Card key={item.label} className="border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
