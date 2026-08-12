import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Sparkles, ClipboardList } from "lucide-react";
import { mockMentees } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

export default function MentorFeedback() {
  const { toast } = useToast();
  const [scores, setScores] = useState({ clarity: 70, fit: 70, execution: 70, innovation: 70 });
  const [notes, setNotes] = useState("");
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="h-6 w-6 text-primary" />Feedback</h1><p className="text-muted-foreground text-sm">Structured feedback with AI assistance</p></div>
      <Card>
        <CardHeader><CardTitle>New Feedback</CardTitle><CardDescription>Rate {mockMentees[0].name} on key dimensions</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          {([
            ["clarity","Idea Clarity"],["fit","Market Fit"],["execution","Execution"],["innovation","Innovation"],
          ] as const).map(([k, label]) => (
            <div key={k}><div className="flex justify-between text-sm mb-2"><span>{label}</span><span className="font-semibold">{scores[k]}/100</span></div>
              <Slider value={[scores[k]]} onValueChange={v => setScores(s => ({ ...s, [k]: v[0] }))} max={100} step={1} />
            </div>
          ))}
          <Textarea placeholder="Written suggestions, action items, milestones…" value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
          <div className="flex gap-2">
            <Button onClick={() => toast({ title: "Feedback saved (demo)" })}>Submit Feedback</Button>
            <Button variant="outline" onClick={() => toast({ title: "AI suggestions coming soon" })}><Sparkles className="mr-2 h-4 w-4" />AI Suggest</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}