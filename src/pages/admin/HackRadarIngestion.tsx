import { Fragment, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Radar, Play, RefreshCw, CheckCircle2, XCircle, Clock, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

type Source = {
  slug: string;
  display_name: string;
  type: string;
  base_url: string | null;
  is_active: boolean;
  last_status: string | null;
  last_run_at: string | null;
};

type Run = {
  id: string;
  source_slug: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  inserted_count: number | null;
  updated_count: number | null;
  skipped_count: number | null;
  error: string | null;
  records_seen: number | null;
  duration_ms: number | null;
  error_details: Array<{ external_id?: string; title?: string; error: string }> | null;
};

export default function HackRadarIngestion() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [running, setRunning] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const sources = useQuery({
    queryKey: ["hackradar-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hackathon_sources")
        .select("slug, display_name, type, base_url, is_active, last_status, last_run_at")
        .order("slug");
      if (error) throw error;
      return data as Source[];
    },
  });

  const runs = useQuery({
    queryKey: ["hackradar-runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hackathon_ingestion_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Run[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("hackradar-ingestion-runs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hackathon_ingestion_runs" },
        () => qc.invalidateQueries({ queryKey: ["hackradar-runs"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const toggleActive = useMutation({
    mutationFn: async ({ slug, active }: { slug: string; active: boolean }) => {
      const { error } = await supabase
        .from("hackathon_sources")
        .update({ is_active: active })
        .eq("slug", slug);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hackradar-sources"] }),
    onError: (e: any) => toast({ variant: "destructive", title: "Update failed", description: e.message }),
  });

  const runIngestion = async (slugs?: string[]) => {
    setRunning(slugs ? slugs.join(",") : "all");
    try {
      const { data, error } = await supabase.functions.invoke("hackradar-ingest", {
        body: slugs ? { sources: slugs } : {},
      });
      if (error) throw error;
      const results = (data as any)?.results || [];
      const totalInserted = results.reduce((n: number, r: any) => n + (r.inserted || 0), 0);
      const totalUpdated = results.reduce((n: number, r: any) => n + (r.updated || 0), 0);
      toast({
        title: "Ingestion complete",
        description: `${totalInserted} new, ${totalUpdated} updated across ${results.length} source${results.length === 1 ? "" : "s"}.`,
      });
      qc.invalidateQueries({ queryKey: ["hackradar-sources"] });
      qc.invalidateQueries({ queryKey: ["hackradar-runs"] });
      qc.invalidateQueries({ queryKey: ["hackradar"] });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Ingestion failed", description: e.message });
    } finally {
      setRunning(null);
    }
  };

  const statusBadge = (status: string | null) => {
    if (status === "success") return <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Success</Badge>;
    if (status === "error") return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
    if (status === "running") return <Badge className="bg-blue-500/15 text-blue-500 border-blue-500/30"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Idle</Badge>;
  };

  return (
    <div className="space-y-8">
      <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-border/50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-8 relative flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <Radar className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">HackRadar Ingestion</h1>
            <p className="text-muted-foreground mt-1">Manage sources, trigger syncs, and review pipeline health.</p>
          </div>
          <Button
            onClick={() => runIngestion()}
            disabled={!!running}
            size="lg"
            className="shrink-0"
          >
            {running === "all" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Run all active sources
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sources</CardTitle>
            <CardDescription>Toggle sources on/off and trigger individual runs.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => sources.refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Last status</TableHead>
                <TableHead>Last run</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(sources.data || []).map((s) => (
                <TableRow key={s.slug}>
                  <TableCell>
                    <div className="font-medium">{s.display_name}</div>
                    <div className="text-xs text-muted-foreground">{s.slug}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{s.type}</Badge></TableCell>
                  <TableCell>
                    <Switch
                      checked={s.is_active}
                      onCheckedChange={(v) => toggleActive.mutate({ slug: s.slug, active: v })}
                    />
                  </TableCell>
                  <TableCell>{statusBadge(s.last_status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.last_run_at ? `${formatDistanceToNow(new Date(s.last_run_at))} ago` : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!running || !s.is_active}
                      onClick={() => runIngestion([s.slug])}
                    >
                      {running === s.slug ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                      <span className="ml-1.5">Run now</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Recent runs</CardTitle>
          <CardDescription>Live feed — updates as ingestion runs complete.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Seen</TableHead>
                <TableHead>Inserted</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Skipped</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(runs.data || []).map((r, i) => {
                const isOpen = expanded === r.id;
                const details = Array.isArray(r.error_details) ? r.error_details : [];
                const hasDetails = details.length > 0 || !!r.error;
                return (
                  <Fragment key={r.id}>
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.02, 0.4) }}
                      className="border-b hover:bg-secondary/30 cursor-pointer"
                      onClick={() => hasDetails && setExpanded(isOpen ? null : r.id)}
                    >
                      <TableCell>
                        {hasDetails ? (isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : null}
                      </TableCell>
                      <TableCell className="font-medium">{r.source_slug}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(r.started_at))} ago
                      </TableCell>
                      <TableCell>{r.records_seen ?? 0}</TableCell>
                      <TableCell>{r.inserted_count ?? 0}</TableCell>
                      <TableCell>{r.updated_count ?? 0}</TableCell>
                      <TableCell>{r.skipped_count ?? 0}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.duration_ms != null ? `${(r.duration_ms / 1000).toFixed(1)}s` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-destructive max-w-xs truncate" title={r.error || ""}>
                        {r.error || ""}
                      </TableCell>
                    </motion.tr>
                    {isOpen && hasDetails && (
                      <tr key={r.id + "-details"} className="bg-secondary/20">
                        <TableCell colSpan={10}>
                          <div className="p-3 space-y-1 max-h-64 overflow-auto">
                            {details.length ? details.slice(0, 50).map((d, idx) => (
                              <div key={idx} className="text-xs font-mono flex gap-2">
                                <span className="text-muted-foreground shrink-0">{d.external_id?.slice(0, 40) || "—"}</span>
                                <span className="text-foreground truncate">{d.title || ""}</span>
                                <span className="text-destructive truncate">{d.error}</span>
                              </div>
                            )) : (
                              <div className="text-xs text-destructive">{r.error}</div>
                            )}
                            {details.length > 50 && (
                              <div className="text-xs text-muted-foreground">…{details.length - 50} more</div>
                            )}
                          </div>
                        </TableCell>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {!runs.isLoading && !(runs.data || []).length && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    No runs yet. Trigger one above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}