import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, Target, CheckCircle } from "lucide-react";
import type { IdeaWorkspace } from "@/hooks/useIdeaWorkspace";

const STAGE_LABELS: Record<string, string> = {
  idea: "💡 Idea",
  validation: "📊 Validation",
  mvp: "🔧 MVP",
  pitch: "🎤 Pitch",
  launch: "🚀 Launch",
};

const STAGES = ["idea", "validation", "mvp", "pitch", "launch"];

export function WorkspaceOverview({ workspace, tasks, validations }: {
  workspace: IdeaWorkspace;
  tasks: any[];
  validations: any[];
}) {
  const completedTasks = tasks.filter(t => t.status === "done").length;
  const latestValidation = validations[0];
  const stageIndex = STAGES.indexOf(workspace.stage);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl">{workspace.idea_name}</CardTitle>
          {workspace.one_liner && (
            <p className="text-muted-foreground">{workspace.one_liner}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{workspace.domain}</Badge>
            <Badge variant="outline">{STAGE_LABELS[workspace.stage] || workspace.stage}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stage Tracker */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Stage Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            {STAGES.map((s, i) => (
              <div key={s} className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i <= stageIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {i < stageIndex ? <CheckCircle className="h-4 w-4" /> : i + 1}
                </div>
                <span className="text-xs text-muted-foreground capitalize hidden sm:block">{s}</span>
              </div>
            ))}
          </div>
          <Progress value={workspace.progress_percent} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">{workspace.progress_percent}% complete</p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/80 border-border/50">
          <CardContent className="pt-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{latestValidation?.overall_score ?? "—"}</p>
            <p className="text-sm text-muted-foreground">Validation Score</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border/50">
          <CardContent className="pt-6 text-center">
            <Activity className="h-8 w-8 mx-auto text-accent mb-2" />
            <p className="text-2xl font-bold">{workspace.health_score ?? 0}</p>
            <p className="text-sm text-muted-foreground">Health Score</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border/50">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{completedTasks}/{tasks.length}</p>
            <p className="text-sm text-muted-foreground">Tasks Done</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
