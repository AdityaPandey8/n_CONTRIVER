import { useState } from "react";
import { motion } from "framer-motion";
import { Presentation, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIdeaWorkspaces, useWorkspaceDetail } from "@/hooks/useIdeaWorkspace";
import { WorkspacePitchDeck } from "@/components/workspace/WorkspacePitchDeck";

function PitchDeckView({ workspaceId, onBack }: { workspaceId: string; onBack: () => void }) {
  const { workspace, details, validations } = useWorkspaceDetail(workspaceId);

  if (!workspace) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
        <h1 className="text-xl font-bold">Pitch Deck — {workspace.idea_name}</h1>
      </div>
      <WorkspacePitchDeck workspace={workspace} details={details} validations={validations} />
    </div>
  );
}

export default function PitchDeckStudio() {
  const { workspaces } = useIdeaWorkspaces();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  if (selectedWorkspaceId) {
    return <PitchDeckView workspaceId={selectedWorkspaceId} onBack={() => setSelectedWorkspaceId(null)} />;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Presentation className="h-6 w-6 text-primary" />
          AI Pitch Deck Studio
        </h1>
        <p className="text-muted-foreground text-sm">Select an idea workspace to generate a pitch deck</p>
      </motion.div>

      {workspaces.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No idea workspaces yet. Create one from My Ideas first.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map(ws => (
            <Card
              key={ws.id}
              className="cursor-pointer hover:shadow-premium transition-all duration-200 hover:border-primary/30"
              onClick={() => setSelectedWorkspaceId(ws.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{ws.idea_name}</CardTitle>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {ws.one_liner && <p className="text-sm text-muted-foreground mb-3">{ws.one_liner}</p>}
                <div className="flex gap-2">
                  <Badge variant="outline">{ws.domain}</Badge>
                  <Badge variant="secondary">{ws.stage}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
