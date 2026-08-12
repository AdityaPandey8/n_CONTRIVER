import { useState } from "react";
import { CheckCircle, XCircle, Loader2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminData } from "@/hooks/useAdminData";
import { formatDistanceToNow } from "date-fns";
import { isDemoId } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

export default function MentorApprovals() {
  const { mentorApplications, loadingApplications, approveMentorApplication, rejectMentorApplication } = useAdminData();
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const { toast } = useToast();
  const blockDemo = (id: string) => {
    if (isDemoId(id)) {
      toast({ title: "Demo entry", description: "This action is disabled for demo data." });
      return true;
    }
    return false;
  };

  const filtered = mentorApplications.filter(
    (a) => filterStatus === "all" || a.status === filterStatus
  );

  if (loadingApplications) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-success" />
            Mentor Approvals
          </h1>
          <p className="text-muted-foreground mt-1">
            {mentorApplications.filter((a) => a.status === "pending").length} pending applications
          </p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((app) => (
          <Card key={app.id} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                    {app.profile?.full_name?.split(" ").map((n: string) => n[0]).join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground">{app.profile?.full_name || "Unknown"}</p>
                    {isDemoId(app.id) && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Demo</Badge>
                    )}
                    <Badge className={`${statusColors[app.status]} border-0 capitalize text-xs`}>
                      {app.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {app.years_experience} years experience • {app.expertise_areas?.join(", ")}
                  </p>
                  <p className="text-sm text-foreground/80 mt-2">{app.motivation}</p>
                  {app.admin_feedback && (
                    <p className="text-xs text-muted-foreground mt-2 italic">Feedback: {app.admin_feedback}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Applied {app.created_at && formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                  </p>
                </div>
                {app.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => { if (!blockDemo(app.id)) rejectMentorApplication.mutate({ applicationId: app.id, feedback: "Application declined" }); }}
                      disabled={rejectMentorApplication.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => { if (!blockDemo(app.id)) approveMentorApplication.mutate({ applicationId: app.id }); }}
                      disabled={approveMentorApplication.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No applications found</p>
          </div>
        )}
      </div>
    </div>
  );
}
