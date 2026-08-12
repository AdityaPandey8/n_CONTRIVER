import { motion } from "framer-motion";
import { Trophy, CheckCircle, Star, Loader2, Calendar, Users, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { mockHackathons, isDemoId } from "@/data/mockData";

export default function HackathonManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: hackathonsData = [], isLoading } = useQuery({
    queryKey: ["admin", "hackathons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hackathons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get registration counts
      const ids = data.map((h) => h.id);
      const { data: regs } = await supabase
        .from("hackathon_registrations")
        .select("hackathon_id")
        .in("hackathon_id", ids);

      const regCounts = new Map<string, number>();
      regs?.forEach((r) => regCounts.set(r.hackathon_id, (regCounts.get(r.hackathon_id) || 0) + 1));

      return data.map((h) => ({ ...h, registrationCount: regCounts.get(h.id) || 0 }));
    },
    enabled: !!user,
  });
  const hackathons = hackathonsData.length > 0
    ? hackathonsData
    : (mockHackathons.map((h) => ({ ...h, registrationCount: h.registrations_count })) as unknown as typeof hackathonsData);

  const verifyHackathon = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      if (isDemoId(id)) throw new Error("Demo entry — action disabled");
      const { error } = await supabase
        .from("hackathons")
        .update({ is_verified: verified, verified_by: verified ? user?.id : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "hackathons"] });
      toast({ title: "Hackathon verification updated" });
    },
    onError: (e: Error) => toast({ title: "Action blocked", description: e.message, variant: "destructive" }),
  });

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
      <Card className="bg-gradient-to-br from-card via-card to-warning/5 border-border/50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-warning/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-8 relative">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-warning to-warning/80 shadow-lg">
              <Trophy className="h-8 w-8 text-warning-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Hackathon Management</h1>
              <p className="text-muted-foreground mt-1">Verify and manage platform hackathons</p>
            </div>
            <Badge variant="outline" className="ml-auto">
              {hackathons.length} hackathons
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5 text-center">
            <p className="text-2xl font-bold text-foreground">{hackathons.length}</p>
            <p className="text-sm text-muted-foreground">Total Hackathons</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 text-center">
            <p className="text-2xl font-bold text-success">{hackathons.filter((h) => h.is_verified).length}</p>
            <p className="text-sm text-muted-foreground">Verified</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 text-center">
            <p className="text-2xl font-bold text-warning">{hackathons.filter((h) => h.status === "upcoming").length}</p>
            <p className="text-sm text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
      </div>

      {/* Hackathon List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>All Hackathons</CardTitle>
          <CardDescription>Review, verify, and manage hackathon events</CardDescription>
        </CardHeader>
        <CardContent>
          {hackathons.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No hackathons found</p>
          ) : (
            <div className="space-y-3">
              {hackathons.map((hackathon, index) => (
                <motion.div
                  key={hackathon.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Trophy className="h-5 w-5 text-warning" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground truncate">{hackathon.title}</h3>
                      {isDemoId(hackathon.id) && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">Demo</Badge>
                      )}
                      {hackathon.is_verified && (
                        <CheckCircle className="h-4 w-4 text-success shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(hackathon.start_date), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {hackathon.registrationCount} registered
                      </span>
                      {hackathon.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {hackathon.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <Badge
                    variant={hackathon.status === "upcoming" ? "default" : hackathon.status === "active" ? "default" : "secondary"}
                  >
                    {hackathon.status}
                  </Badge>

                  <Button
                    size="sm"
                    variant={hackathon.is_verified ? "outline" : "default"}
                    onClick={() => verifyHackathon.mutate({ id: hackathon.id, verified: !hackathon.is_verified })}
                    className="shrink-0"
                  >
                    {hackathon.is_verified ? "Unverify" : "Verify"}
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
