import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Props {
  userId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function UserProfileDrawer({ userId, open, onOpenChange }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: async () => {
      if (!userId) return null;
      const [profile, ideas, workspaces, matches] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("ideas").select("id,title,domain,votes_count,created_at").eq("user_id", userId).limit(20),
        supabase.from("idea_workspaces").select("id,idea_name,stage,progress_percent").eq("user_id", userId).limit(20),
        supabase.from("match_scores").select("target_type,score,target_id").eq("user_id", userId).order("score", { ascending: false }).limit(20),
      ]);
      return { profile: profile.data, ideas: ideas.data ?? [], workspaces: workspaces.data ?? [], matches: matches.data ?? [] };
    },
    enabled: !!userId && open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        {isLoading || !data ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={data.profile?.avatar_url ?? undefined} />
                  <AvatarFallback>{data.profile?.full_name?.[0] ?? "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle>{data.profile?.full_name ?? "User"}</SheetTitle>
                  <SheetDescription>{data.profile?.email}</SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <Tabs defaultValue="activity" className="mt-6">
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="ideas">Ideas</TabsTrigger>
                <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
                <TabsTrigger value="matches">Matches</TabsTrigger>
              </TabsList>
              <TabsContent value="activity" className="space-y-2 mt-4">
                <Row label="Headline" value={data.profile?.headline ?? "—"} />
                <Row label="Joined" value={data.profile?.created_at ? new Date(data.profile.created_at).toLocaleDateString() : "—"} />
                <Row label="Mentor" value={data.profile?.is_mentor ? "Yes" : "No"} />
                <Row label="Investor" value={data.profile?.is_investor ? "Yes" : "No"} />
                <Row label="Recruiter" value={data.profile?.is_recruiter ? "Yes" : "No"} />
              </TabsContent>
              <TabsContent value="ideas" className="mt-4 space-y-2">
                {data.ideas.length === 0 && <p className="text-sm text-muted-foreground">No ideas.</p>}
                {data.ideas.map((i) => (
                  <div key={i.id} className="p-3 rounded-lg bg-secondary/30 flex items-center justify-between">
                    <div><p className="text-sm font-medium text-foreground">{i.title}</p><p className="text-xs text-muted-foreground">{i.domain}</p></div>
                    <Badge variant="outline">{i.votes_count} votes</Badge>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="workspaces" className="mt-4 space-y-2">
                {data.workspaces.length === 0 && <p className="text-sm text-muted-foreground">No workspaces.</p>}
                {data.workspaces.map((w) => (
                  <div key={w.id} className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-sm font-medium text-foreground">{w.idea_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="capitalize">{w.stage}</Badge>
                      <span className="text-xs text-muted-foreground">{w.progress_percent}% complete</span>
                    </div>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="matches" className="mt-4 space-y-2">
                {data.matches.length === 0 && <p className="text-sm text-muted-foreground">No matches yet.</p>}
                {data.matches.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
                    <Badge variant="outline" className="capitalize">{m.target_type}</Badge>
                    <code className="text-xs text-muted-foreground">{m.target_id.slice(0, 12)}</code>
                    <span className="font-semibold text-foreground">{m.score}</span>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}