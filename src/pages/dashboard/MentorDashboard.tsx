import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, Calendar, Star, Award, ClipboardList, BookOpen, ArrowRight, AlertTriangle, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useAuth } from "@/contexts/AuthContext";
import {
  mockMentorStats, mockMentees, mockMentorRequests, mockMentorSessions, mockMentorImpact,
} from "@/data/mockData";

export default function MentorDashboard() {
  const { profile } = useAuth();
  const needsAttention = mockMentees.filter(m => m.needsAttention);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-border/50 overflow-hidden relative">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold">Welcome, {profile?.full_name?.split(" ")[0] || "Mentor"} 🧑‍🏫</h1>
                <p className="text-lg text-muted-foreground">Guide founders, track impact, build your reputation.</p>
              </div>
              <div className="flex gap-3">
                <Button asChild variant="outline"><Link to="/dashboard/mentor/sessions"><Calendar className="mr-2 h-4 w-4" />Schedule</Link></Button>
                <Button asChild className="gradient-primary text-primary-foreground"><Link to="/dashboard/mentor/mentees"><Users className="mr-2 h-4 w-4" />My Mentees</Link></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Mentees" value={mockMentorStats.totalMentees} icon={Users} delay={0.05} />
        <StatsCard title="Sessions Conducted" value={mockMentorStats.sessionsConducted} icon={Calendar} delay={0.1} />
        <StatsCard title="Avg Rating" value={mockMentorStats.avgRating} icon={Star} delay={0.15} />
        <StatsCard title="Impact Score" value={`${mockMentorStats.impactScore}/100`} icon={Award} delay={0.2} />
      </div>

      {needsAttention.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader><CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400"><AlertTriangle className="h-5 w-5" />Needs Attention</CardTitle><CardDescription>AI flagged these mentees as struggling</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {needsAttention.map(m => (
              <div key={m.id} className="flex items-center gap-4 p-3 rounded-xl bg-card/60">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center font-bold text-amber-700">{m.name.charAt(0)}</div>
                <div className="flex-1 min-w-0"><p className="font-medium text-sm">{m.name} <Badge variant="outline" className="text-[10px] ml-1">Demo</Badge></p><p className="text-xs text-muted-foreground">{m.startup} • Last contact {m.lastInteraction}</p></div>
                <div className="w-24"><Progress value={m.progress} className="h-1.5" /><p className="text-xs text-right text-muted-foreground mt-1">{m.progress}%</p></div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />My Mentees</CardTitle><CardDescription>Active mentorships</CardDescription></div>
            <Button asChild variant="ghost" size="sm"><Link to="/dashboard/mentor/mentees">View All<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockMentees.slice(0, 4).map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">{m.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{m.name} <Badge variant="outline" className="text-[10px] ml-1">Demo</Badge></p>
                  <p className="text-xs text-muted-foreground truncate">{m.startup} • {m.stage}</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">{m.progress}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Upcoming Sessions</CardTitle><CardDescription>{mockMentorStats.upcomingSessions} scheduled</CardDescription></div>
            <Button asChild variant="ghost" size="sm"><Link to="/dashboard/mentor/sessions">View All<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockMentorSessions.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                <div><p className="font-medium text-sm">{s.topic} <Badge variant="outline" className="text-[10px] ml-1">Demo</Badge></p><p className="text-xs text-muted-foreground">{s.menteeName} • {s.type}</p></div>
                <div className="text-right"><p className="text-xs font-semibold">{s.date}</p><p className="text-xs text-muted-foreground">{s.duration} min</p></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />Pending Requests</CardTitle><CardDescription>{mockMentorRequests.length} new</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {mockMentorRequests.slice(0, 3).map(r => (
              <div key={r.id} className="p-3 rounded-xl bg-secondary/30">
                <div className="flex justify-between items-start">
                  <p className="font-medium text-sm">{r.name} <Badge variant="outline" className="text-[10px] ml-1">Demo</Badge></p>
                  <span className="text-xs text-muted-foreground">{r.requestedAt}</span>
                </div>
                <p className="text-xs text-muted-foreground">{r.startup} • {r.stage}</p>
                <p className="text-xs mt-1">"{r.message}"</p>
                <div className="flex gap-2 mt-2"><Button size="sm" className="h-7 text-xs">Accept</Button><Button size="sm" variant="outline" className="h-7 text-xs">Decline</Button></div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-primary" />Impact & Reputation</CardTitle><CardDescription>How founders are growing with you</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-secondary/40 p-3"><p className="text-xs text-muted-foreground">Startups Helped</p><p className="text-2xl font-bold">{mockMentorImpact.startupsHelped}</p></div>
              <div className="rounded-lg bg-secondary/40 p-3"><p className="text-xs text-muted-foreground">Funded</p><p className="text-2xl font-bold text-emerald-600">{mockMentorImpact.fundedStartups}</p></div>
            </div>
            <div className="flex flex-wrap gap-2">{mockMentorImpact.badges.map(b => <Badge key={b} className="bg-amber-500/10 text-amber-700 dark:text-amber-400" variant="secondary">🏆 {b}</Badge>)}</div>
            <div className="space-y-2">
              {mockMentorImpact.recentReviews.map((r, i) => (
                <div key={i} className="text-xs p-2 rounded bg-secondary/30"><div className="flex justify-between"><span className="font-medium">{r.from}</span><span>{"★".repeat(r.rating)}</span></div><p className="text-muted-foreground">"{r.text}"</p></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}