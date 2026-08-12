import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ClipboardList } from "lucide-react";
import { mockFounderTasks, mockFounderMilestones } from "@/data/mockData";

export default function FounderTasks() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="h-6 w-6 text-primary" />Tasks & Milestones</h1></div>
      <Card><CardHeader><CardTitle>Tasks</CardTitle></CardHeader><CardContent className="space-y-2">
        {mockFounderTasks.map(t => (
          <div key={t.id} className="flex justify-between items-center p-3 rounded-xl bg-secondary/30">
            <div><p className="text-sm font-medium">{t.title} <Badge variant="outline" className="text-[10px] ml-1">Demo</Badge></p><p className="text-xs text-muted-foreground">{t.priority} • Due {t.dueDate}</p></div>
            <Badge variant={t.status === "in_progress" ? "default" : "secondary"} className="text-[10px]">{t.status.replace("_", " ")}</Badge>
          </div>
        ))}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Milestones</CardTitle></CardHeader><CardContent className="space-y-3">
        {mockFounderMilestones.map(m => (
          <div key={m.id}>
            <div className="flex justify-between text-sm mb-1"><span>{m.done ? "✅" : "⏳"} {m.title} <Badge variant="outline" className="text-[10px] ml-1">Demo</Badge></span>{!m.done && <span className="text-muted-foreground">{m.progress}%</span>}</div>
            {!m.done && <Progress value={m.progress} className="h-1.5" />}
          </div>
        ))}
      </CardContent></Card>
    </div>
  );
}