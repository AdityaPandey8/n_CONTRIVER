import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { mockMentorSessions, mockMentorRequests } from "@/data/mockData";

export default function MentorSessions() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="h-6 w-6 text-primary" />Sessions</h1><p className="text-muted-foreground text-sm">Schedule, accept, and review past sessions</p></div>
      <Card><CardContent className="p-4">
        <p className="font-semibold mb-3">Upcoming</p>
        <div className="space-y-2">{mockMentorSessions.map(s => (
          <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
            <div><p className="font-medium text-sm">{s.topic} <Badge variant="outline" className="text-[10px] ml-1">Demo</Badge></p><p className="text-xs text-muted-foreground">{s.menteeName} • {s.type} • {s.duration}min</p></div>
            <div className="text-right text-xs"><p className="font-semibold">{s.date}</p><Button size="sm" variant="outline" className="mt-1 h-6 text-[10px]">Join</Button></div>
          </div>
        ))}</div>
      </CardContent></Card>
      <Card><CardContent className="p-4">
        <p className="font-semibold mb-3">Requests</p>
        <div className="space-y-2">{mockMentorRequests.map(r => (
          <div key={r.id} className="p-3 rounded-xl bg-secondary/30">
            <div className="flex justify-between"><p className="font-medium text-sm">{r.name} <Badge variant="outline" className="text-[10px] ml-1">Demo</Badge></p><span className="text-xs text-muted-foreground">{r.requestedAt}</span></div>
            <p className="text-xs text-muted-foreground">{r.startup} — "{r.message}"</p>
            <div className="flex gap-2 mt-2"><Button size="sm" className="h-7 text-xs">Accept</Button><Button size="sm" variant="outline" className="h-7 text-xs">Decline</Button></div>
          </div>
        ))}</div>
      </CardContent></Card>
    </div>
  );
}