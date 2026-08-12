import { useState } from "react";
import { Briefcase, Loader2, Trash2, ToggleLeft, ToggleRight, Search, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { mockJobs, isDemoId } from "@/data/mockData";

export default function JobManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: jobsData = [], isLoading } = useQuery({
    queryKey: ["admin", "jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = [...new Set(data.map((j) => j.posted_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      return data.map((j) => ({ ...j, poster: profileMap.get(j.posted_by) }));
    },
  });
  const jobs = jobsData.length > 0 ? jobsData : (mockJobs as unknown as typeof jobsData);
  const blockDemo = (id: string) => {
    if (isDemoId(id)) {
      toast({ title: "Demo entry", description: "This action is disabled for demo data." });
      return true;
    }
    return false;
  };

  const toggleJobActive = useMutation({
    mutationFn: async ({ jobId, isActive }: { jobId: string; isActive: boolean }) => {
      const { error } = await supabase.from("jobs").update({ is_active: isActive }).eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
      toast({ title: "Job status updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase.from("jobs").delete().eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
      toast({ title: "Job deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = jobs.filter((j) => {
    const matchesSearch =
      !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && j.is_active) ||
      (statusFilter === "inactive" && !j.is_active);
    return matchesSearch && matchesStatus;
  });

  const activeCount = jobs.filter((j) => j.is_active).length;
  const totalApplications = jobs.reduce((s, j) => s + (j.applications_count || 0), 0);

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
          <Briefcase className="h-6 w-6 text-primary" />
          Job Management
        </h1>
        <p className="text-muted-foreground mt-1">
          {jobs.length} total · {activeCount} active · {jobs.length - activeCount} inactive · {totalApplications} applications
        </p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((job) => (
          <Card key={job.id} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground">{job.title}</p>
                    {isDemoId(job.id) && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Demo</Badge>
                    )}
                    <Badge className={job.is_active ? "bg-success/10 text-success border-0 text-xs" : "bg-destructive/10 text-destructive border-0 text-xs"}>
                      {job.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{job.company_name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                    <Badge variant="outline" className="text-xs capitalize">{job.work_type}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{job.job_type}</Badge>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job.applications_count || 0} apps</span>
                  </div>
                  {(job as any).poster && (
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Posted by {(job as any).poster.full_name || (job as any).poster.email}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant={job.is_active ? "secondary" : "default"}
                    onClick={() => { if (!blockDemo(job.id)) toggleJobActive.mutate({ jobId: job.id, isActive: !job.is_active }); }}
                    disabled={toggleJobActive.isPending}
                  >
                    {job.is_active ? <ToggleRight className="h-4 w-4 mr-1" /> : <ToggleLeft className="h-4 w-4 mr-1" />}
                    {job.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => { if (!blockDemo(job.id)) deleteJob.mutate(job.id); }}
                    disabled={deleteJob.isPending}
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
            <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No jobs found</p>
          </div>
        )}
      </div>
    </div>
  );
}
