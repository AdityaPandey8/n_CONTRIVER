import { useState } from "react";
import { Megaphone, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBroadcast } from "@/hooks/useBroadcast";
import { formatDistanceToNow } from "date-fns";

const ROLES = ["innovator", "founder", "investor", "mentor", "student"];

export default function Broadcast() {
  const { history, isLoading, send } = useBroadcast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targets, setTargets] = useState<string[]>([]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Megaphone className="h-6 w-6 text-primary" />Communication Center</h1>
        <p className="text-muted-foreground mt-1">Broadcast announcements to selected roles</p>
      </div>

      <Card className="border-border/50">
        <CardHeader><CardTitle>Compose</CardTitle><CardDescription>Sent as in-app notifications</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Message body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={targets.length === 0 ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTargets([])}
            >All users</Badge>
            {ROLES.map((r) => (
              <Badge
                key={r}
                variant={targets.includes(r) ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() => setTargets((t) => t.includes(r) ? t.filter((x) => x !== r) : [...t, r])}
              >{r}</Badge>
            ))}
          </div>
          <Button
            disabled={!title || !body || send.isPending}
            onClick={() => send.mutate({ title, body, target_roles: targets }, { onSuccess: () => { setTitle(""); setBody(""); setTargets([]); } })}
          >
            <Send className="h-4 w-4 mr-2" />Send broadcast
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader><CardTitle>Sent broadcasts</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="divide-y divide-border">
              {history.length === 0 && <p className="text-center text-muted-foreground py-8">No broadcasts yet.</p>}
              {history.map((b) => (
                <div key={b.id} className="py-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{b.title}</p>
                    <Badge variant="outline" className="text-[10px]">{b.recipients_count} users</Badge>
                    <span className="ml-auto text-xs text-muted-foreground">{formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{b.body}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}