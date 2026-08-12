import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Plus,
  Search as SearchIcon,
  MoreHorizontal,
  Pin,
  Star,
  Trash2,
  Pencil,
  Share2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  useAIConversations,
  type AIConversation,
} from "@/hooks/useAIConversations";
import { AI_MODULES, getModule, type AIModuleKey } from "@/lib/aiModules";
import { cn } from "@/lib/utils";
import { ActiveWorkspaceProvider } from "@/contexts/ActiveWorkspaceContext";
import { WorkspaceContextPicker } from "./WorkspaceContextPicker";

interface Props {
  moduleKey: AIModuleKey;
  conversationId: string | null;
  children: React.ReactNode;
}

export function AIHubLayout({ moduleKey, conversationId, children }: Props) {
  return (
    <ActiveWorkspaceProvider>
      <AIHubLayoutInner moduleKey={moduleKey} conversationId={conversationId}>
        {children}
      </AIHubLayoutInner>
    </ActiveWorkspaceProvider>
  );
}

function AIHubLayoutInner({ moduleKey, conversationId, children }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const { list, create, update, remove } = useAIConversations(moduleKey, search);
  const mod = getModule(moduleKey);
  const ModIcon = mod.icon;

  const conversations = list.data ?? [];

  const startNew = () => navigate(`/dashboard/ai/${moduleKey}`);

  const handleRename = async (c: AIConversation) => {
    const next = window.prompt("Rename chat", c.title);
    if (next && next.trim() && next !== c.title) {
      await update.mutateAsync({ id: c.id, patch: { title: next.trim() } });
    }
  };

  const handleDelete = async (c: AIConversation) => {
    if (!window.confirm("Delete this chat?")) return;
    await remove.mutateAsync(c.id);
    if (conversationId === c.id) navigate(`/dashboard/ai/${moduleKey}`);
    toast({ title: "Chat deleted" });
  };

  const handleShare = async (c: AIConversation) => {
    const slug = c.share_slug ?? crypto.randomUUID();
    await update.mutateAsync({
      id: c.id,
      patch: { is_shared: true, share_slug: slug },
    });
    const url = `${window.location.origin}/share/chat/${slug}`;
    await navigator.clipboard.writeText(url);
    toast({ title: "Share link copied", description: url });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Left rail */}
      <aside className="hidden md:flex flex-col w-72 border-r bg-card/30">
        <div className="p-3">
          <Button onClick={startNew} className="w-full justify-start gap-2 rounded-xl">
            <Plus className="h-4 w-4" /> New chat
          </Button>
        </div>

        <div className="px-3 pb-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground px-2 mb-2">
            Modules
          </p>
          <div className="space-y-0.5">
            {AI_MODULES.map((m) => {
              const Icon = m.icon;
              const active = m.key === moduleKey;
              return (
                <Link
                  key={m.key}
                  to={`/dashboard/ai/${m.key}`}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors",
                    active
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
                >
                  <span
                    className={cn(
                      "h-7 w-7 rounded-md bg-gradient-to-br flex items-center justify-center shrink-0",
                      m.accent,
                    )}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </span>
                  <span className="truncate">{m.title}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="px-3 pt-1">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats"
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 mt-2">
          <div className="px-2 pb-4 space-y-0.5">
            {conversations.length === 0 ? (
              <p className="px-3 py-6 text-xs text-muted-foreground text-center">
                No chats yet
              </p>
            ) : (
              conversations.map((c) => {
                const active = c.id === conversationId;
                return (
                  <div
                    key={c.id}
                    className={cn(
                      "group flex items-center gap-1 rounded-lg pr-1",
                      active ? "bg-accent" : "hover:bg-accent/50",
                    )}
                  >
                    <Link
                      to={`/dashboard/ai/${moduleKey}/${c.id}`}
                      className="flex-1 min-w-0 px-2.5 py-2 text-sm"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {c.is_pinned && <Pin className="h-3 w-3 shrink-0 text-primary" />}
                        {c.is_favorite && <Star className="h-3 w-3 shrink-0 text-amber-500" />}
                        <span className="truncate">{c.title || "Untitled"}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                      </p>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleRename(c)}>
                          <Pencil className="h-3.5 w-3.5 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            update.mutate({ id: c.id, patch: { is_pinned: !c.is_pinned } })
                          }
                        >
                          <Pin className="h-3.5 w-3.5 mr-2" />
                          {c.is_pinned ? "Unpin" : "Pin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            update.mutate({
                              id: c.id,
                              patch: { is_favorite: !c.is_favorite },
                            })
                          }
                        >
                          <Star className="h-3.5 w-3.5 mr-2" />
                          {c.is_favorite ? "Unfavorite" : "Favorite"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(c)}>
                          <Share2 className="h-3.5 w-3.5 mr-2" /> Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(c)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="px-3 py-3 border-t">
          <Link
            to="/dashboard/ai"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Sparkles className="h-3.5 w-3.5" /> Contrivers AI Home
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-2 border-b bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn("h-6 w-6 rounded-md bg-gradient-to-br flex items-center justify-center shrink-0", mod.accent)}>
              <ModIcon className="h-3.5 w-3.5 text-white" />
            </span>
            <span className="text-sm font-medium truncate">{mod.title}</span>
          </div>
          <WorkspaceContextPicker />
        </div>
        {children}
      </div>
    </div>
  );
}