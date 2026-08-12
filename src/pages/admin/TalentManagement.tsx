import { useState } from "react";
import { UserCheck, Loader2, Trash2, Star, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { mockTalents, isDemoId } from "@/data/mockData";

export default function TalentManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [availFilter, setAvailFilter] = useState("all");

  const { data: talentsData = [], isLoading } = useQuery({
    queryKey: ["admin", "talents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("talents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = [...new Set(data.map((t) => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      return data.map((t) => ({ ...t, profile: profileMap.get(t.user_id) }));
    },
  });
  const talents = talentsData.length > 0 ? talentsData : (mockTalents as unknown as typeof talentsData);
  const blockDemo = (id: string) => {
    if (isDemoId(id)) {
      toast({ title: "Demo entry", description: "This action is disabled for demo data." });
      return true;
    }
    return false;
  };

  const toggleFeatured = useMutation({
    mutationFn: async ({ talentId, isFeatured }: { talentId: string; isFeatured: boolean }) => {
      const { error } = await supabase.from("talents").update({ is_featured: isFeatured }).eq("id", talentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "talents"] });
      toast({ title: "Featured status updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteTalent = useMutation({
    mutationFn: async (talentId: string) => {
      const { error } = await supabase.from("talents").delete().eq("id", talentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "talents"] });
      toast({ title: "Talent profile deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = talents.filter((t) => {
    const name = (t as any).profile?.full_name || "";
    const matchesSearch =
      !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesAvail =
      availFilter === "all" || t.availability === availFilter;
    return matchesSearch && matchesAvail;
  });

  const featuredCount = talents.filter((t) => t.is_featured).length;
  const availableCount = talents.filter((t) => t.availability === "available").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-primary" />
          Talent Management
        </h1>
        <p className="text-muted-foreground mt-1">
          {talents.length} total · {availableCount} available · {featuredCount} featured
        </p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search talents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={availFilter} onValueChange={setAvailFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="busy">Busy</SelectItem>
            <SelectItem value="not_available">Not Available</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((talent) => (
          <Card key={talent.id} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground">
                      {(talent as any).profile?.full_name || "Unknown"}
                    </p>
                    {isDemoId(talent.id) && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Demo</Badge>
                    )}
                    {talent.is_featured && (
                      <Badge className="bg-warning/10 text-warning border-0 text-xs">Featured</Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${
                        talent.availability === "available"
                          ? "border-success/50 text-success"
                          : talent.availability === "not_available"
                          ? "border-destructive/50 text-destructive"
                          : "border-warning/50 text-warning"
                      }`}
                    >
                      {talent.availability?.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{talent.title}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {talent.skills.slice(0, 5).map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                    {talent.skills.length > 5 && (
                      <Badge variant="secondary" className="text-xs">+{talent.skills.length - 5}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {talent.experience_years ? `${talent.experience_years} yrs exp` : "No exp listed"}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant={talent.is_featured ? "secondary" : "outline"}
                    onClick={() => { if (!blockDemo(talent.id)) toggleFeatured.mutate({ talentId: talent.id, isFeatured: !talent.is_featured }); }}
                    disabled={toggleFeatured.isPending}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    {talent.is_featured ? "Unfeature" : "Feature"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => { if (!blockDemo(talent.id)) deleteTalent.mutate(talent.id); }}
                    disabled={deleteTalent.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <UserCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No talents found</p>
          </div>
        )}
      </div>
    </div>
  );
}
