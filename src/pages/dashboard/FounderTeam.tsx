import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import { mockFounderRoles, mockFounderApplicants, mockFounderTeam } from "@/data/mockData";

export default function FounderTeam() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" />Team Builder</h1><p className="text-muted-foreground text-sm">Roles, applicants, and your team</p></div>
        <Button><Plus className="mr-2 h-4 w-4" />Post Role</Button>
      </div>
      <Card><CardHeader><CardTitle>Open Roles</CardTitle></CardHeader><CardContent className="space-y-2">
        {mockFounderRoles.map(r => (
          <div key={r.id} className="flex justify-between p-3 rounded-xl bg-secondary/30 text-sm">
            <span>{r.title} <Badge variant="outline" className="text-[10px] ml-1">Demo</Badge></span>
            <span className="text-muted-foreground">{r.applicants} applicants • {r.status}</span>
          </div>
        ))}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>AI-Matched Applicants</CardTitle></CardHeader><CardContent className="space-y-2">
        {mockFounderApplicants.map(a => (
          <div key={a.id} className="flex justify-between items-center p-3 rounded-xl bg-secondary/30">
            <div><p className="font-medium text-sm">{a.name} <Badge variant="outline" className="text-[10px] ml-1">Demo</Badge></p><p className="text-xs text-muted-foreground">{a.headline} • {a.role}</p></div>
            <div className="text-right"><p className="font-bold text-primary text-sm">{a.match}% match</p></div>
          </div>
        ))}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Current Team</CardTitle></CardHeader><CardContent className="space-y-2">
        {mockFounderTeam.map(t => (
          <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30"><div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">{t.name.charAt(0)}</div><div><p className="text-sm font-medium">{t.name}</p><p className="text-xs text-muted-foreground">{t.role}</p></div></div>
        ))}
      </CardContent></Card>
    </div>
  );
}