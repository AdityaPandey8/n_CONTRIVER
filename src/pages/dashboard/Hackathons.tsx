import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Radar, Search, Filter, Bookmark, BookmarkCheck, Users, Trophy,
  MapPin, Clock, ExternalLink, Sparkles, TrendingUp, Flame, IndianRupee,
  Loader2, CalendarDays, Globe2, Building2, Rocket, ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useHackRadar, useHackRadarStats, type HackRadarFilters } from "@/hooks/useHackRadar";
import { useTeammatePosts } from "@/hooks/useHackTeams";
import { useHackathons } from "@/hooks/useHackathons";
import { useAuth } from "@/contexts/AuthContext";

const THEME_OPTIONS = [
  "AI", "Machine Learning", "Web Development", "Cybersecurity",
  "Blockchain", "Open Innovation", "AR/VR", "Mobile Development",
  "Design", "FinTech", "HealthTech", "ClimateTech",
];

const MODE_OPTIONS: HackRadarFilters["mode"][] = ["any", "online", "offline", "hybrid"];
const SORT_OPTIONS: { value: HackRadarFilters["sort"]; label: string; icon: any }[] = [
  { value: "trending", label: "Trending", icon: Flame },
  { value: "deadline", label: "Closing soon", icon: Clock },
  { value: "prize", label: "Biggest prizes", icon: Trophy },
  { value: "newest", label: "Newest", icon: Sparkles },
];

function formatINR(n: number | null | undefined) {
  if (!n) return null;
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n}`;
}

function DeadlineBadge({ deadline }: { deadline: string | null }) {
  if (!deadline) return null;
  const d = new Date(deadline);
  const diff = d.getTime() - Date.now();
  if (diff < 0) return <Badge variant="outline" className="text-muted-foreground">Closed</Badge>;
  const hours = diff / 3600_000;
  const urgent = hours < 72;
  return (
    <Badge
      variant="outline"
      className={urgent
        ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"
        : "border-primary/30 bg-primary/5 text-primary"}
    >
      <Clock className="h-3 w-3 mr-1" />
      Closes {formatDistanceToNow(d, { addSuffix: true })}
    </Badge>
  );
}

function HackCard({ h, onSave, onOpen }: any) {
  const prize = formatINR(h.prize_pool_inr) || h.prize_pool_text || h.prize;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <Card
        onClick={onOpen}
        className="h-full cursor-pointer overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all"
      >
        <CardContent className="p-5 flex flex-col gap-4 h-full">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="capitalize text-[10px] font-medium">
                {h.source_slug}
              </Badge>
              <Badge variant="outline" className="capitalize text-[10px] gap-1">
                <Globe2 className="h-3 w-3" />{h.mode}
              </Badge>
              {h.is_beginner_friendly && (
                <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                  Beginner
                </Badge>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onSave(!h.is_saved); }}
              className="text-muted-foreground hover:text-primary transition"
              aria-label={h.is_saved ? "Unsave" : "Save"}
            >
              {h.is_saved
                ? <BookmarkCheck className="h-5 w-5 text-primary" />
                : <Bookmark className="h-5 w-5" />}
            </button>
          </div>

          <div>
            <h3 className="font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition">
              {h.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {h.organizer}
            </p>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {h.description}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {(h.themes?.length ? h.themes : h.tags || []).slice(0, 4).map((t: string) => (
              <Badge key={t} variant="secondary" className="text-[10px] font-normal">{t}</Badge>
            ))}
          </div>

          <div className="mt-auto space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {prize ? (
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />{prize}
                </span>
              ) : <span />}
              {(h.city || h.location) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{h.city || h.location}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <DeadlineBadge deadline={h.registration_deadline} />
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {h.saves_count || 0} saves
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatTile({ icon: Icon, label, value, tone }: any) {
  return (
    <Card className="border-border/60 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl grid place-items-center ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-lg font-semibold text-foreground leading-none">{value}</div>
          <div className="text-xs text-muted-foreground mt-1">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Hackathons() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<HackRadarFilters>({ sort: "trending" });
  const [activeThemes, setActiveThemes] = useState<string[]>([]);
  const [tab, setTab] = useState("discover");

  const merged: HackRadarFilters = useMemo(
    () => ({ ...filters, q: q || undefined, themes: activeThemes.length ? activeThemes : undefined }),
    [filters, q, activeThemes],
  );

  const { listings, toggleSave, prefs, savePrefs } = useHackRadar(merged);
  const stats = useHackRadarStats();
  const { myRegistrations } = useHackathons();

  const all = listings.data || [];
  const trending = useMemo(
    () => [...all].sort((a, b) => (b.saves_count || 0) - (a.saves_count || 0)).slice(0, 8),
    [all],
  );
  const forYou = useMemo(() => {
    const interests = prefs.data?.interests || [];
    if (!interests.length) return all;
    return [...all].sort((a, b) => {
      const score = (h: any) => (h.themes || []).filter((t: string) => interests.includes(t)).length;
      return score(b) - score(a);
    });
  }, [all, prefs.data]);
  const saved = useMemo(() => all.filter((h) => h.is_saved), [all]);

  const toggleTheme = (t: string) =>
    setActiveThemes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-6 sm:p-8"
      >
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Radar className="h-3.5 w-3.5" />
              HackRadar — aggregated hackathon discovery
            </div>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Never miss a hackathon again.
            </h1>
            <p className="mt-2 text-muted-foreground max-w-xl">
              Every Indian hackathon from Unstop, Devfolio, Devpost, Reskilll and more — in one radar.
              Track deadlines, find teammates, and win more.
            </p>
          </div>
          <TeammatePostButton />
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={Rocket} label="Active hackathons" value={stats.data?.active ?? "—"} tone="bg-primary/15 text-primary" />
        <StatTile icon={Clock} label="Closing this week" value={stats.data?.closingThisWeek ?? "—"} tone="bg-red-500/10 text-red-500" />
        <StatTile icon={IndianRupee} label="Prize pool tracked" value={formatINR(stats.data?.totalPrizeInr) || "—"} tone="bg-amber-500/10 text-amber-500" />
        <StatTile icon={Bookmark} label="Your saved" value={saved.length} tone="bg-emerald-500/10 text-emerald-500" />
      </div>

      {/* Search + filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search AI, Web3, Cybersecurity, colleges, cities…"
            className="pl-10 h-11 bg-card/60"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-11 gap-2">
                <Filter className="h-4 w-4" /> Filters
                {(filters.mode && filters.mode !== "any" || filters.city || filters.minPrize || filters.beginnerOnly || filters.studentOnly || filters.soloAllowed || filters.deadlineWithinDays) && (
                  <Badge variant="secondary" className="ml-1 h-5">on</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Mode</Label>
                  <div className="flex gap-1 mt-2">
                    {MODE_OPTIONS.map((m) => (
                      <Button
                        key={m}
                        size="sm"
                        variant={filters.mode === m || (!filters.mode && m === "any") ? "default" : "outline"}
                        onClick={() => setFilters((f) => ({ ...f, mode: m }))}
                        className="capitalize flex-1 h-8"
                      >
                        {m}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="city" className="text-xs">City</Label>
                  <Input id="city" placeholder="e.g. Delhi NCR" value={filters.city || ""} onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value || undefined }))} className="h-9 mt-1" />
                </div>
                <div>
                  <Label htmlFor="prize" className="text-xs">Min prize (INR)</Label>
                  <Input id="prize" type="number" placeholder="50000" value={filters.minPrize || ""} onChange={(e) => setFilters((f) => ({ ...f, minPrize: e.target.value ? Number(e.target.value) : undefined }))} className="h-9 mt-1" />
                </div>
                <div>
                  <Label htmlFor="deadline" className="text-xs">Deadline within (days)</Label>
                  <Input id="deadline" type="number" placeholder="14" value={filters.deadlineWithinDays || ""} onChange={(e) => setFilters((f) => ({ ...f, deadlineWithinDays: e.target.value ? Number(e.target.value) : undefined }))} className="h-9 mt-1" />
                </div>
                <div className="space-y-2">
                  {[
                    ["beginnerOnly", "Beginner friendly"],
                    ["studentOnly", "Student only"],
                    ["soloAllowed", "Solo participation allowed"],
                  ].map(([k, label]) => (
                    <div key={k} className="flex items-center justify-between">
                      <Label htmlFor={k} className="text-sm font-normal">{label}</Label>
                      <Switch
                        id={k}
                        checked={!!(filters as any)[k]}
                        onCheckedChange={(v) => setFilters((f) => ({ ...f, [k]: v || undefined }))}
                      />
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setFilters({ sort: filters.sort })}>
                  Reset filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-11 gap-2">
                <TrendingUp className="h-4 w-4" />
                {SORT_OPTIONS.find((s) => s.value === (filters.sort || "trending"))?.label}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="end">
              <div className="flex flex-col gap-1">
                {SORT_OPTIONS.map((s) => (
                  <Button key={s.value} variant={filters.sort === s.value ? "secondary" : "ghost"} className="justify-start gap-2" size="sm" onClick={() => setFilters((f) => ({ ...f, sort: s.value }))}>
                    <s.icon className="h-4 w-4" /> {s.label}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {user && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-11 gap-2">
                  <Sparkles className="h-4 w-4" /> Interests
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-3">
                  <div className="text-sm font-medium">Personalize your feed</div>
                  <p className="text-xs text-muted-foreground">Pick topics you care about — HackRadar will surface matching hackathons.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {THEME_OPTIONS.map((t) => {
                      const on = (prefs.data?.interests || []).includes(t);
                      return (
                        <Badge
                          key={t}
                          onClick={() => {
                            const cur = prefs.data?.interests || [];
                            const next = on ? cur.filter((x: string) => x !== t) : [...cur, t];
                            savePrefs.mutate({ interests: next });
                          }}
                          variant={on ? "default" : "outline"}
                          className="cursor-pointer"
                        >
                          {t}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Theme chips */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {THEME_OPTIONS.map((t) => {
            const on = activeThemes.includes(t);
            return (
              <button
                key={t}
                onClick={() => toggleTheme(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  on
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card/40 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Trending strip */}
      {trending.length > 0 && !q && activeThemes.length === 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" /> Trending on HackRadar
            </h2>
          </div>
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-3">
              {trending.map((h) => (
                <div key={h.id} className="w-72 shrink-0">
                  <HackCard
                    h={h}
                    onSave={(v: boolean) => toggleSave.mutate({ id: h.id, save: v })}
                    onOpen={() => navigate(`/dashboard/hackathon/${h.id}`)}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-card/60 backdrop-blur-sm border border-border/50">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="for-you">
            <Sparkles className="h-3.5 w-3.5 mr-1" /> For you
          </TabsTrigger>
          <TabsTrigger value="saved">
            Saved {saved.length > 0 && <Badge variant="secondary" className="ml-2">{saved.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="teams">Team formation</TabsTrigger>
          <TabsTrigger value="registered">
            Registered {myRegistrations.length > 0 && <Badge variant="secondary" className="ml-2">{myRegistrations.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="mt-6">
          <GridOrEmpty
            loading={listings.isLoading}
            items={all}
            onSave={(id, v) => toggleSave.mutate({ id, save: v })}
            onOpen={(id) => navigate(`/dashboard/hackathon/${id}`)}
          />
        </TabsContent>
        <TabsContent value="for-you" className="mt-6">
          {user ? (
            <GridOrEmpty
              loading={listings.isLoading}
              items={forYou}
              onSave={(id, v) => toggleSave.mutate({ id, save: v })}
              onOpen={(id) => navigate(`/dashboard/hackathon/${id}`)}
              emptyLabel="Set interests to personalize your feed."
            />
          ) : (
            <Empty label="Sign in to unlock a personalized feed." />
          )}
        </TabsContent>
        <TabsContent value="saved" className="mt-6">
          <GridOrEmpty
            loading={listings.isLoading}
            items={saved}
            onSave={(id, v) => toggleSave.mutate({ id, save: v })}
            onOpen={(id) => navigate(`/dashboard/hackathon/${id}`)}
            emptyLabel="Bookmark hackathons to build your watchlist."
          />
        </TabsContent>
        <TabsContent value="teams" className="mt-6">
          <TeammateBoard />
        </TabsContent>
        <TabsContent value="registered" className="mt-6">
          {myRegistrations.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {myRegistrations.map((r) => (
                <Card key={r.id} className="cursor-pointer hover:border-primary/40" onClick={() => navigate(`/dashboard/hackathon/${r.hackathon_id}`)}>
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{r.hackathon?.title}</h3>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">{r.hackathon?.organizer}</p>
                    {r.team_name && <Badge variant="secondary">Team: {r.team_name}</Badge>}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Empty label="You haven't registered for any hackathons yet." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GridOrEmpty({ loading, items, onSave, onOpen, emptyLabel }: any) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!items.length) return <Empty label={emptyLabel || "No hackathons match your filters."} />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((h: any) => (
        <HackCard key={h.id} h={h} onSave={(v: boolean) => onSave(h.id, v)} onOpen={() => onOpen(h.id)} />
      ))}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="text-center py-16 border border-dashed border-border/60 rounded-xl bg-card/30">
      <Radar className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function TeammateBoard() {
  const { posts } = useTeammatePosts();
  const navigate = useNavigate();
  const items = posts.data || [];
  if (posts.isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!items.length) return <Empty label="No open teammate searches yet. Be the first to post." />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((p: any) => (
        <Card key={p.id} className="border-border/60">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-foreground">{p.headline}</h4>
                {p.user && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {p.user.full_name} · {p.user.headline || "Builder"}
                  </p>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/hackathon/${p.hackathon_id}`)}>
                View hackathon <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
            {p.message && <p className="text-sm text-muted-foreground">{p.message}</p>}
            <div className="flex flex-wrap gap-1.5">
              {(p.looking_for_skills || []).map((s: string) => (
                <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
              ))}
            </div>
            {p.user && (
              <div className="flex gap-3 text-xs text-muted-foreground pt-2 border-t border-border/50">
                {p.user.github_url && <a href={p.user.github_url} target="_blank" rel="noreferrer" className="hover:text-primary">GitHub</a>}
                {p.user.portfolio_url && <a href={p.user.portfolio_url} target="_blank" rel="noreferrer" className="hover:text-primary">Portfolio</a>}
                {p.availability && <span>· {p.availability}</span>}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TeammatePostButton() {
  const { user } = useAuth();
  const { createPost } = useTeammatePosts();
  const [open, setOpen] = useState(false);
  const [hackathonId, setHackathonId] = useState("");
  const [headline, setHeadline] = useState("");
  const [message, setMessage] = useState("");
  const [skills, setSkills] = useState("");
  const [role, setRole] = useState("");
  const [avail, setAvail] = useState("");

  if (!user) return null;
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Users className="h-4 w-4" /> Find teammates
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post a teammate search</DialogTitle>
            <DialogDescription>
              Tell the community which hackathon you're joining and what you're looking for.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Hackathon ID</Label>
              <Input value={hackathonId} onChange={(e) => setHackathonId(e.target.value)} placeholder="Paste from the hackathon URL" />
            </div>
            <div>
              <Label className="text-xs">Headline</Label>
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Looking for a designer + ML engineer for HackNU" />
            </div>
            <div>
              <Label className="text-xs">Skills needed (comma-separated)</Label>
              <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, PyTorch, Figma" />
            </div>
            <div>
              <Label className="text-xs">Your role</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Full-stack engineer" />
            </div>
            <div>
              <Label className="text-xs">Availability</Label>
              <Input value={avail} onChange={(e) => setAvail(e.target.value)} placeholder="Evenings IST, full weekend" />
            </div>
            <div>
              <Label className="text-xs">Message</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What you want to build, prior experience, vibe…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              disabled={!hackathonId || !headline || createPost.isPending}
              onClick={async () => {
                await createPost.mutateAsync({
                  hackathon_id: hackathonId,
                  headline,
                  message: message || undefined,
                  role_preference: role || undefined,
                  availability: avail || undefined,
                  looking_for_skills: skills ? skills.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
                });
                setOpen(false);
              }}
            >
              {createPost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}