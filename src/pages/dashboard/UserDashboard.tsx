import { motion } from "framer-motion";
import { 
  Lightbulb, Users, Trophy, Rocket, ArrowRight, Sparkles, Target, 
  TrendingUp, Bookmark, Briefcase, Loader2, Compass, FolderOpen, 
  Bot, Presentation, CheckCircle, Star, MapPin, GraduationCap, Code
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AIAssistantCard } from "@/components/dashboard/AIAssistantCard";
import { QuickTips } from "@/components/dashboard/QuickTips";
import { useAuth } from "@/contexts/AuthContext";
import { useConnections } from "@/hooks/useConnections";
import { useHackathons } from "@/hooks/useHackathons";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { useIdeaWorkspaces } from "@/hooks/useIdeaWorkspace";
import { useMentors } from "@/hooks/useMentors";
import { useStartups } from "@/hooks/useStartups";
import { useJobs } from "@/hooks/useJobs";
import { format } from "date-fns";

const quickActions = [
  { title: "Explore Ideas", description: "AI-powered idea intelligence", icon: Compass, href: "/dashboard/idea-explorer", color: "from-indigo-500 to-violet-500" },
  { title: "My Ideas", description: "Manage your idea workspaces", icon: FolderOpen, href: "/dashboard/my-ideas", color: "from-blue-500 to-indigo-500" },
  { title: "AI Mentor", description: "Get AI guidance", icon: Bot, href: "/dashboard/ai-mentor", color: "from-emerald-500 to-teal-500" },
  { title: "Pitch Feedback", description: "Improve your pitch", icon: Presentation, href: "/dashboard/pitch-feedback", color: "from-violet-500 to-purple-500" },
  { title: "Ideas Hub", description: "Browse trending ideas", icon: Lightbulb, href: "/dashboard/ideas", color: "from-amber-500 to-yellow-500" },
  { title: "Join Hackathon", description: "Compete and collaborate", icon: Trophy, href: "/dashboard/hackathons", color: "from-cyan-500 to-blue-500" },
];

const STAGE_LABELS: Record<string, string> = {
  idea: "💡 Idea", validation: "📊 Validation", mvp: "🔧 MVP", pitch: "🎤 Pitch", launch: "🚀 Launch",
};

export default function UserDashboard() {
  const { profile } = useAuth();
  const { connections } = useConnections();
  const { hackathons, myRegistrations, isLoading: hackathonsLoading } = useHackathons();
  const { savedPosts, savedShorts } = useSavedPosts();
  const { workspaces, isLoading: workspacesLoading } = useIdeaWorkspaces();
  const { mentors } = useMentors();
  const { startups } = useStartups();
  const { jobs } = useJobs();

  const upcomingHackathons = hackathons.filter(h => new Date(h.start_date) > new Date()).slice(0, 3);
  const featuredMentors = mentors.slice(0, 3);
  const trendingStartups = startups.slice(0, 3);
  const hotJobs = jobs.slice(0, 2);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const calculateProfileCompletion = () => {
    if (!profile) return 0;
    const fields = [profile.full_name, profile.bio, profile.location, profile.website, profile.linkedin_url, profile.avatar_url];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  };

  const activeWorkspaces = workspaces.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-border/50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-8 relative">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                  {getGreeting()}, {profile?.full_name?.split(" ")[0] || "there"}! 👋
                </h1>
                <p className="text-lg text-muted-foreground">
                  Here's what's happening with your innovation journey today.
                </p>
              </div>
              <div className="flex gap-3">
                <Button asChild variant="outline" className="hover:bg-primary/5">
                  <Link to="/dashboard/idea-explorer"><Compass className="mr-2 h-4 w-4" />Explore</Link>
                </Button>
                <Button asChild className="gradient-primary text-primary-foreground shadow-lg">
                  <Link to="/dashboard/my-ideas"><Sparkles className="mr-2 h-5 w-5" />Create Idea</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="My Ideas" value={workspacesLoading ? 0 : workspaces.length} icon={FolderOpen} iconColor="from-amber-500/20 to-amber-500/10" delay={0.1} />
        <StatsCard title="Connections" value={connections.length} icon={Users} iconColor="from-emerald-500/20 to-emerald-500/10" delay={0.2} />
        <StatsCard title="Hackathons Joined" value={myRegistrations.length} icon={Trophy} iconColor="from-violet-500/20 to-violet-500/10" delay={0.3} />
        <StatsCard title="Saved Items" value={savedPosts.length + savedShorts.length} icon={Bookmark} iconColor="from-rose-500/20 to-rose-500/10" delay={0.4} />
      </div>

      {/* Current Idea Progress */}
      {activeWorkspaces.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Current Ideas</CardTitle>
                <CardDescription>Your active idea workspaces</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm"><Link to="/dashboard/my-ideas">View All<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeWorkspaces.map((ws) => (
                <Link key={ws.id} to={`/dashboard/workspace/${ws.id}`} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{ws.idea_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{STAGE_LABELS[ws.stage] || ws.stage}</Badge>
                      <span className="text-xs text-muted-foreground">{ws.domain}</span>
                    </div>
                  </div>
                  <div className="w-24 space-y-1">
                    <Progress value={ws.progress_percent} className="h-1.5" />
                    <p className="text-xs text-muted-foreground text-right">{ws.progress_percent}%</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Upcoming Hackathons */}
      {upcomingHackathons.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" />Upcoming Hackathons</CardTitle>
                <CardDescription>Compete, build, and win prizes</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm"><Link to="/dashboard/hackathons">View All<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {upcomingHackathons.map((h) => (
                  <Link
                    key={h.id}
                    to={`/dashboard/hackathon/${h.id}`}
                    className="group p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-secondary/50 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Trophy className="h-4 w-4 text-primary" />
                      </div>
                      {h.id.startsWith("demo_") && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">Demo</Badge>
                      )}
                    </div>
                    <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {h.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">by {h.organizer}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(h.start_date), "MMM d")}
                      </span>
                      {h.prize && (
                        <span className="text-xs font-medium text-primary truncate ml-2">{h.prize}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {h.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Opportunities Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="space-y-6">
          {/* Featured Mentors */}
          {featuredMentors.length > 0 && (
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" />Featured Mentors</CardTitle>
                  <CardDescription>Get guidance from experienced professionals</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm"><Link to="/dashboard/mentors">View All<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {featuredMentors.map((mentor) => (
                    <Link key={mentor.id} to={`/dashboard/mentor/${mentor.id}`} className="group p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-secondary/50 hover:border-primary/30 transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {mentor.profile?.full_name?.charAt(0) || "M"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                              {mentor.profile?.full_name}
                            </p>
                            {mentor.id.startsWith("demo_") && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Demo</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{mentor.profile?.headline}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-medium">{mentor.rating}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{mentor.total_reviews} reviews</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {mentor.expertise.slice(0, 2).map((exp) => (
                              <Badge key={exp} variant="secondary" className="text-[10px] px-1.5 py-0">{exp}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trending Startups + Hot Jobs */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Trending Startups */}
            {trendingStartups.length > 0 && (
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Rocket className="h-5 w-5 text-primary" />Trending Startups</CardTitle>
                    <CardDescription>Explore innovative ventures</CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm"><Link to="/dashboard/startups">View All<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trendingStartups.map((startup) => (
                    <Link key={startup.id} to={`/dashboard/startup/${startup.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {startup.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-foreground truncate">{startup.name}</p>
                          {startup.id.startsWith("demo_") && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Demo</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{startup.tagline}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="text-[10px] capitalize">{startup.stage}</Badge>
                        <span className="text-[10px] text-muted-foreground">{startup.industry}</span>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Hot Jobs */}
            {hotJobs.length > 0 && (
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" />Hot Jobs</CardTitle>
                    <CardDescription>Opportunities at startups</CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm"><Link to="/dashboard/jobs">View All<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {hotJobs.map((job) => (
                    <Link key={job.id} to={`/dashboard/job/${job.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Code className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-foreground truncate">{job.title}</p>
                          {job.id.startsWith("demo_") && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Demo</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{job.company_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">{job.job_type}</Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />{job.location}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        <p>{job.applications_count} applicants</p>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </motion.div>

      {/* AI Assistant */}
      <AIAssistantCard delay={0.35} />

      {/* Quick Actions + Profile */}
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" />Quick Actions</CardTitle>
              <CardDescription>Jump right into your next step</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.title} to={action.href} className="group flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-card/50 hover:bg-secondary/50 hover:border-primary/30 transition-all">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${action.color} shadow-lg`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{action.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Profile Completion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{calculateProfileCompletion()}%</span>
                  </div>
                  <Progress value={calculateProfileCompletion()} className="h-2" />
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/dashboard/profile">Complete Profile<ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
          <QuickTips delay={0.6} />
        </div>
      </div>

      {/* Upcoming Hackathons */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" />Upcoming Hackathons</CardTitle>
              <CardDescription>Join and compete with innovators</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm"><Link to="/dashboard/hackathons">View All<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </CardHeader>
          <CardContent>
            {hackathonsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : upcomingHackathons.length > 0 ? (
              <div className="space-y-3">
                {upcomingHackathons.map((h) => (
                  <Link key={h.id} to={`/dashboard/hackathon/${h.id}`} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="p-2.5 rounded-xl bg-primary/10"><Trophy className="h-5 w-5 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{h.title}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(h.start_date), "MMM d, yyyy")}</p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary capitalize">{h.status}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No upcoming hackathons</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
