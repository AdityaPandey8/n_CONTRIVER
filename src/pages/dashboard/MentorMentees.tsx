import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, AlertTriangle } from "lucide-react";
import { mockMentees } from "@/data/mockData";

export default function MentorMentees() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" />My Mentees</h1><p className="text-muted-foreground text-sm">Track progress and goals</p></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockMentees.map(m => (
          <Card key={m.id}><CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">{m.name.charAt(0)}</div>
                <div><p className="font-semibold text-sm">{m.name}</p><p className="text-xs text-muted-foreground">{m.startup}</p></div>
              </div>
              <Badge variant="outline" className="text-[10px]">Demo</Badge>
            </div>
            {m.needsAttention && <div className="flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="h-3 w-3" />Needs attention</div>}
            <div><div className="flex justify-between text-xs mb-1"><span>Progress</span><span>{m.progress}%</span></div><Progress value={m.progress} className="h-1.5" /></div>
            <div className="flex flex-wrap gap-1"><Badge variant="secondary" className="text-[10px]">{m.stage}</Badge><Badge variant="outline" className="text-[10px]">Last: {m.lastInteraction}</Badge></div>
            <div><p className="text-xs font-medium mb-1">Goals</p><ul className="text-xs text-muted-foreground space-y-0.5">{m.goals.map(g => <li key={g}>• {g}</li>)}</ul></div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}