import { useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  LayoutDashboard,
  FileText,
  TrendingUp,
  Target,
  CheckSquare,
  FolderOpen,
  Loader2,
  Milestone,
  Shield,
  Bot,
  StickyNote,
} from "lucide-react";
import { useWorkspaceDetail } from "@/hooks/useIdeaWorkspace";
import { WorkspaceOverview } from "@/components/workspace/WorkspaceOverview";
import { WorkspaceDetails } from "@/components/workspace/WorkspaceDetails";
import { WorkspaceValidation } from "@/components/workspace/WorkspaceValidation";
import { WorkspaceTasks } from "@/components/workspace/WorkspaceTasks";
import { WorkspaceDocuments } from "@/components/workspace/WorkspaceDocuments";
import { WorkspaceRoadmap } from "@/components/workspace/WorkspaceRoadmap";
import { WorkspaceBlockchain } from "@/components/workspace/WorkspaceBlockchain";
import { WorkspaceNotes } from "@/components/workspace/WorkspaceNotes";
import { WorkspacePitchDeck } from "@/components/workspace/WorkspacePitchDeck";
import { WorkspaceFeedback } from "@/components/workspace/WorkspaceFeedback";
import { IdeaEvolutionTimeline } from "@/components/workspace/IdeaEvolutionTimeline";
import { AIChat } from "@/components/ai-hub/AIChat";
import { cn } from "@/lib/utils";

interface NavLeaf {
  value: string;
  label: string;
  icon: React.ElementType;
}
interface NavGroup {
  label: string;
  items: NavLeaf[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [{ value: "overview", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Planning",
    items: [
      { value: "details", label: "Details", icon: FileText },
      { value: "validation", label: "Validation", icon: TrendingUp },
      { value: "strategy", label: "Strategy", icon: Target },
    ],
  },
  {
    label: "Execution",
    items: [
      { value: "tasks", label: "Tasks", icon: CheckSquare },
      { value: "roadmap", label: "Roadmap", icon: Milestone },
      { value: "documents", label: "Documents", icon: FolderOpen },
    ],
  },
  {
    label: "AI",
    items: [
      { value: "ai-mentor", label: "AI Mentor", icon: Bot },
    ],
  },
  {
    label: "Knowledge",
    items: [{ value: "notes", label: "Notes", icon: StickyNote }],
  },
  {
    label: "Security",
    items: [{ value: "blockchain", label: "Proof", icon: Shield }],
  },
];

const ALL_TAB_VALUES = new Set(
  NAV_GROUPS.flatMap((g) => g.items.map((i) => i.value)).concat([
    "evolution",
    "pitch",
    "feedback",
  ]),
);

export default function IdeaWorkspace() {
  const { ideaId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") || "overview";
  const activeTab = ALL_TAB_VALUES.has(tabParam) ? tabParam : "overview";

  const {
    workspace, isLoading,
    details, saveDetail,
    tasks, createTask, updateTask, deleteTask,
    documents, uploadDocument, deleteDocument,
    feedback, addFeedback,
    validations,
  } = useWorkspaceDetail(ideaId);

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const aiContext = useMemo(() => {
    if (!workspace) return null;
    return {
      idea_name: workspace.idea_name,
      one_liner: workspace.one_liner,
      stage: workspace.stage,
      domain: workspace.domain,
      details,
      latest_validation: validations?.[0] ?? null,
      tasks: tasks?.slice(0, 20) ?? [],
    };
  }, [workspace, details, validations, tasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold mb-2">Workspace not found</h2>
        <Button onClick={() => navigate("/dashboard/my-ideas")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Ideas
        </Button>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <WorkspaceOverview workspace={workspace} tasks={tasks} validations={validations} />;
      case "details":
        return <WorkspaceDetails details={details} saveDetail={saveDetail} />;
      case "validation":
        return (
          <WorkspaceValidation
            workspaceId={workspace.id}
            details={details}
            validations={validations}
            workspaceName={workspace.idea_name}
          />
        );
      case "strategy":
        return (
          <div className="text-center py-16 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <h3 className="text-lg font-semibold mb-2">Strategy Builder</h3>
            <p>Generate business model and go-to-market plans for this idea.</p>
            <Button className="mt-4" onClick={() => navigate("/dashboard/ai/strategy")}>
              Open Strategy Builder
            </Button>
          </div>
        );
      case "tasks":
        return (
          <WorkspaceTasks tasks={tasks} createTask={createTask} updateTask={updateTask} deleteTask={deleteTask} />
        );
      case "roadmap":
        return <WorkspaceRoadmap details={details} validations={validations} hasPitchDeck={false} hasSharedPitch={false} />;
      case "documents":
        return (
          <WorkspaceDocuments documents={documents} uploadDocument={uploadDocument} deleteDocument={deleteDocument} />
        );
      case "ai-mentor":
        return (
          <div className="h-[calc(100vh-16rem)] min-h-[480px] border rounded-xl overflow-hidden bg-card">
            <AIChat
              moduleKey="mentor"
              conversationId={null}
              workspaceId={workspace.id}
              workspaceContext={aiContext}
              embedded
            />
          </div>
        );
      case "notes":
        return <WorkspaceNotes workspaceId={workspace.id} />;
      case "blockchain":
        return <WorkspaceBlockchain workspace={workspace} details={details} />;
      case "evolution":
        return <IdeaEvolutionTimeline workspaceId={workspace.id} />;
      case "pitch":
        return <WorkspacePitchDeck workspace={workspace} details={details} validations={validations} />;
      case "feedback":
        return <WorkspaceFeedback feedback={feedback} addFeedback={addFeedback} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 -mx-6 sm:-mx-8 px-6 sm:px-8 py-3 bg-background/80 backdrop-blur border-b">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/my-ideas")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground truncate">{workspace.idea_name}</h1>
              <Badge variant="outline" className="capitalize text-xs">{workspace.stage}</Badge>
            </div>
            {workspace.one_liner && (
              <p className="text-muted-foreground text-xs sm:text-sm truncate">{workspace.one_liner}</p>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-3 min-w-[180px]">
            <span className="text-xs text-muted-foreground">Progress</span>
            <Progress value={workspace.progress_percent ?? 0} className="h-1.5 flex-1" />
            <span className="text-xs font-medium tabular-nums">{workspace.progress_percent ?? 0}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" onClick={() => setTab("ai-mentor")}>
              <Bot className="h-3.5 w-3.5 mr-1.5" /> AI Mentor
            </Button>
            <Button size="sm" variant="outline" onClick={() => setTab("notes")}>
              <StickyNote className="h-3.5 w-3.5 mr-1.5" /> Note
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        {/* Vertical nav */}
        <nav className="space-y-5">
          {NAV_GROUPS.map((g) => (
            <div key={g.label}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-1.5">
                {g.label}
              </p>
              <div className="space-y-0.5">
                {g.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.value;
                  return (
                    <button
                      key={item.value}
                      onClick={() => setTab(item.value)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors",
                        active
                          ? "bg-accent text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="min-w-0"
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  );
}
