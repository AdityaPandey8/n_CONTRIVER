import { useEffect, useState } from "react";
import { Radio, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAIUsage } from "@/hooks/useAIUsage";

interface Event { id: string; table: string; event: string; at: number; }

export default function RealtimeMonitor() {
  const [events, setEvents] = useState<Event[]>([]);
  const [presence, setPresence] = useState(0);
  const usage = useAIUsage(1);

  useEffect(() => {
    const ch = supabase
      .channel("realtime-monitor-presence", { config: { presence: { key: crypto.randomUUID() } } })
      .on("postgres_changes", { event: "*", schema: "public" }, (payload) => {
        const table = (payload as { table?: string }).table ?? "?";
        setEvents((e) => [{ id: crypto.randomUUID(), table, event: payload.eventType, at: Date.now() }, ...e].slice(0, 50));
      })
      .on("presence", { event: "sync" }, () => {
        setPresence(Object.keys(ch.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await ch.track({ at: Date.now() });
      });
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Radio className="h-6 w-6 text-primary" />Realtime Monitor
          <span className="ml-2 flex items-center gap-1 text-xs text-success"><span className="w-2 h-2 rounded-full bg-success animate-pulse" />Live</span>
        </h1>
        <p className="text-muted-foreground mt-1">Active sessions, AI usage, live events</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50"><CardContent className="p-5">
          <p className="text-xs text-muted-foreground">Active sessions</p>
          <p className="text-3xl font-bold text-foreground">{presence}</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-5">
          <p className="text-xs text-muted-foreground">AI requests (24h)</p>
          <p className="text-3xl font-bold text-foreground">{usage.data?.total ?? 0}</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-5">
          <p className="text-xs text-muted-foreground">Avg latency</p>
          <p className="text-3xl font-bold text-foreground">{usage.data?.avgLatency ?? 0}ms</p>
        </CardContent></Card>
      </div>
      <Card className="border-border/50">
        <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Event stream</CardTitle><CardDescription>Last 50 database events</CardDescription></CardHeader>
        <CardContent>
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {events.length === 0 && <p className="text-center text-muted-foreground py-8">Waiting for events…</p>}
            {events.map((e) => (
              <div key={e.id} className="py-2 flex items-center gap-3 text-sm">
                <Badge variant="outline" className="text-[10px]">{e.event}</Badge>
                <code className="text-xs text-muted-foreground">{e.table}</code>
                <span className="ml-auto text-xs text-muted-foreground">{new Date(e.at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}