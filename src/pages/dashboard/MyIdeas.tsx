import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Lightbulb, Trash2, Loader2, ArrowRight } from "lucide-react";
import { useIdeaWorkspaces } from "@/hooks/useIdeaWorkspace";

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  idea: { label: "💡 Idea", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  validation: { label: "📊 Validation", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  mvp: { label: "🔧 MVP", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  pitch: { label: "🎤 Pitch", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  launch: { label: "🚀 Launch", color: "bg-green-500/10 text-green-600 border-green-500/20" },
};

const DOMAINS = ["AI/ML", "EdTech", "HealthTech", "FinTech", "GreenTech", "Civic Tech", "Social Impact", "PropTech", "E-commerce", "General"];

export default function MyIdeas() {
  const navigate = useNavigate();
  const { workspaces, isLoading, createWorkspace, deleteWorkspace } = useIdeaWorkspaces();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ idea_name: "", one_liner: "", domain: "General" });

  const handleCreate = async () => {
    if (!form.idea_name.trim()) return;
    const result = await createWorkspace.mutateAsync(form);
    setShowCreate(false);
    setForm({ idea_name: "", one_liner: "", domain: "General" });
    navigate(`/dashboard/workspace/${result.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Ideas</h1>
          <p className="text-muted-foreground mt-1">Manage and develop your innovation ideas</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gradient-accent text-accent-foreground">
          <Plus className="h-4 w-4 mr-2" />
          New Idea
        </Button>
      </div>

      {/* Ideas Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : workspaces.length === 0 ? (
        <Card className="bg-card/80 border-border/50">
          <CardContent className="py-16 text-center">
            <Lightbulb className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No ideas yet</h3>
            <p className="text-muted-foreground mb-6">Create your first idea workspace to start building your innovation.</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Idea
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws, i) => {
            const stageInfo = STAGE_LABELS[ws.stage] || STAGE_LABELS.idea;
            return (
              <motion.div
                key={ws.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="bg-card/80 border-border/50 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate(`/dashboard/workspace/${ws.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                        {ws.idea_name}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWorkspace.mutate(ws.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {ws.one_liner && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{ws.one_liner}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={stageInfo.color}>{stageInfo.label}</Badge>
                      <Badge variant="secondary">{ws.domain}</Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{ws.progress_percent}%</span>
                      </div>
                      <Progress value={ws.progress_percent} className="h-1.5" />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">
                        Updated {new Date(ws.updated_at).toLocaleDateString()}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Idea</DialogTitle>
            <DialogDescription>Start a new idea workspace to develop your innovation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Idea Name *</Label>
              <Input
                placeholder="My brilliant idea"
                value={form.idea_name}
                onChange={(e) => setForm(p => ({ ...p, idea_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>One-line Description</Label>
              <Input
                placeholder="A short description of your idea"
                value={form.one_liner}
                onChange={(e) => setForm(p => ({ ...p, one_liner: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Domain</Label>
              <Select value={form.domain} onValueChange={(v) => setForm(p => ({ ...p, domain: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.idea_name.trim() || createWorkspace.isPending}>
              {createWorkspace.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
