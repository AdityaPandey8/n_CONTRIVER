import { motion } from "framer-motion";
import { Activity, CheckCircle, XCircle, Shield, UserX, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminData } from "@/hooks/useAdminData";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "report_resolved" | "report_dismissed" | "mentor_approved" | "mentor_rejected" | "user_banned";
  title: string;
  description: string;
  timestamp: string;
}

export default function ActivityLog() {
  const { contentReports, mentorApplications, loadingReports, loadingApplications } = useAdminData();

  const isLoading = loadingReports || loadingApplications;

  // Build activity items from resolved reports and reviewed applications
  const activities: ActivityItem[] = [
    ...contentReports
      .filter((r) => r.status !== "pending")
      .map((r) => ({
        id: r.id,
        type: (r.status === "resolved" ? "report_resolved" : "report_dismissed") as ActivityItem["type"],
        title: r.status === "resolved" ? "Content report resolved" : "Content report dismissed",
        description: `${r.content_type} report: ${r.reason}${r.resolution ? ` — ${r.resolution}` : ""}`,
        timestamp: r.resolved_at || r.created_at || "",
      })),
    ...mentorApplications
      .filter((a) => a.status !== "pending")
      .map((a) => ({
        id: a.id,
        type: (a.status === "approved" ? "mentor_approved" : "mentor_rejected") as ActivityItem["type"],
        title: a.status === "approved" ? "Mentor application approved" : "Mentor application rejected",
        description: `${a.profile?.full_name || "User"} — ${a.expertise_areas.slice(0, 2).join(", ")}`,
        timestamp: a.reviewed_at || a.created_at || "",
      })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "report_resolved": return <CheckCircle className="h-5 w-5 text-success" />;
      case "report_dismissed": return <XCircle className="h-5 w-5 text-muted-foreground" />;
      case "mentor_approved": return <Shield className="h-5 w-5 text-primary" />;
      case "mentor_rejected": return <XCircle className="h-5 w-5 text-destructive" />;
      case "user_banned": return <UserX className="h-5 w-5 text-destructive" />;
    }
  };

  const getBadgeVariant = (type: ActivityItem["type"]) => {
    switch (type) {
      case "report_resolved":
      case "mentor_approved": return "default" as const;
      case "report_dismissed": return "secondary" as const;
      case "mentor_rejected":
      case "user_banned": return "destructive" as const;
    }
  };

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
      <Card className="bg-gradient-to-br from-card via-card to-accent/5 border-border/50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-8 relative">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-accent to-accent/80 shadow-lg">
              <Activity className="h-8 w-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Activity Log</h1>
              <p className="text-muted-foreground mt-1">Timeline of admin actions and platform events</p>
            </div>
            <Badge variant="outline" className="ml-auto">
              {activities.length} events
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
          <CardDescription>Approvals, resolutions, and moderation actions</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No activity recorded yet</p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-1">
                {activities.slice(0, 50).map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="relative flex items-start gap-4 pl-12 py-3 rounded-lg hover:bg-secondary/30 transition-colors"
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-[18px] top-4 w-3 h-3 rounded-full bg-card border-2 border-accent z-10" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getIcon(activity.type)}
                        <span className="font-medium text-foreground text-sm">{activity.title}</span>
                        <Badge variant={getBadgeVariant(activity.type)} className="text-[10px]">
                          {activity.type.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : ""}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
