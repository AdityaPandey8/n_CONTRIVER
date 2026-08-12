import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3 } from "lucide-react";
import { mockFounderAnalytics } from "@/data/mockData";

export default function FounderAnalytics() {
  const max = Math.max(...mockFounderAnalytics.weeklyUsers.map(w => w.users));
  const cMax = Math.max(...mockFounderAnalytics.competitors.map(c => c.score));
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" />Analytics</h1><p className="text-muted-foreground text-sm">User growth, retention, competitor benchmarks</p></div>
      <Card><CardHeader><CardTitle>Weekly Active Users</CardTitle><CardDescription>Last 4 weeks</CardDescription></CardHeader>
        <CardContent><div className="flex items-end gap-3 h-40">{mockFounderAnalytics.weeklyUsers.map(w => (
          <div key={w.week} className="flex-1 flex flex-col items-center gap-2"><div className="w-full bg-primary rounded-t" style={{ height: `${(w.users/max)*100}%` }} /><p className="text-xs text-muted-foreground">{w.week}</p><p className="text-xs font-semibold">{w.users.toLocaleString()}</p></div>
        ))}</div></CardContent>
      </Card>
      <Card><CardHeader><CardTitle>Retention</CardTitle></CardHeader><CardContent><Progress value={mockFounderAnalytics.retention} className="h-3" /><p className="text-sm mt-2">{mockFounderAnalytics.retention}% 30-day retention</p></CardContent></Card>
      <Card><CardHeader><CardTitle>Competitor Comparison</CardTitle><CardDescription>Health score benchmark</CardDescription></CardHeader>
        <CardContent className="space-y-3">{mockFounderAnalytics.competitors.map(c => (
          <div key={c.name}><div className="flex justify-between text-sm mb-1"><span className={c.name === "Your Startup" ? "font-bold text-primary" : ""}>{c.name}</span><span>{c.score}</span></div><Progress value={(c.score/cMax)*100} className="h-2" /></div>
        ))}</CardContent>
      </Card>
    </div>
  );
}