import { ShieldAlert, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminData } from "@/hooks/useAdminData";
import { formatDistanceToNow } from "date-fns";

export default function FraudQuality() {
  const { contentReports, loadingReports, resolveContentReport } = useAdminData();

  if (loadingReports) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const pending = contentReports.filter((r) => r.status === "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-destructive" />
          Fraud & Quality Control
        </h1>
        <p className="text-muted-foreground mt-1">AI-detected risks, duplicate ideas, and moderation queue</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50"><CardContent className="p-5">
          <p className="text-xs text-muted-foreground">Pending reports</p>
          <p className="text-3xl font-bold text-destructive mt-1">{pending.length}</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-5">
          <p className="text-xs text-muted-foreground">Resolved this week</p>
          <p className="text-3xl font-bold text-success mt-1">{contentReports.filter((r) => r.status === "resolved").length}</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-5">
          <p className="text-xs text-muted-foreground">Dismissed</p>
          <p className="text-3xl font-bold text-muted-foreground mt-1">{contentReports.filter((r) => r.status === "dismissed").length}</p>
        </CardContent></Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Moderation Queue</CardTitle>
          <CardDescription>Review reported content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {pending.length === 0 && <p className="text-center text-muted-foreground py-8">Queue is empty.</p>}
            {pending.map((r) => (
              <div key={r.id} className="py-3 flex items-center gap-3">
                <Badge variant="outline" className="capitalize">{r.content_type}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.reason}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.description ?? "No details"}</p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                <Button size="sm" variant="outline" onClick={() => resolveContentReport.mutate({ reportId: r.id, status: "dismissed" })}>Dismiss</Button>
                <Button size="sm" variant="destructive" onClick={() => resolveContentReport.mutate({ reportId: r.id, status: "resolved", resolution: "Content removed" })}>Resolve</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}