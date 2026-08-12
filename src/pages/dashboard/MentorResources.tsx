import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Upload } from "lucide-react";
import { mockMentorResources } from "@/data/mockData";

export default function MentorResources() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="h-6 w-6 text-primary" />Resources</h1><p className="text-muted-foreground text-sm">Share guides, templates, and recordings</p></div>
        <Button><Upload className="mr-2 h-4 w-4" />Upload</Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockMentorResources.map(r => (
          <Card key={r.id}><CardContent className="p-4 space-y-2">
            <div className="flex justify-between"><p className="font-semibold text-sm">{r.title}</p><Badge variant="outline" className="text-[10px]">Demo</Badge></div>
            <p className="text-xs text-muted-foreground">{r.type} • {r.downloads} downloads</p>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}