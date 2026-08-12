import { useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Plus, Trash2, Search as SearchIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIdeaNotes, type IdeaNote } from "@/hooks/useIdeaNotes";
import { cn } from "@/lib/utils";

interface Props {
  workspaceId: string;
}

export function WorkspaceNotes({ workspaceId }: Props) {
  const { list, create, update, remove } = useIdeaNotes(workspaceId);
  const notes = list.data ?? [];
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedFor = useRef<string | null>(null);

  const active = useMemo(() => notes.find((n) => n.id === activeId) ?? null, [notes, activeId]);

  useEffect(() => {
    if (!activeId && notes.length > 0) setActiveId(notes[0].id);
  }, [notes, activeId]);

  useEffect(() => {
    if (active && hydratedFor.current !== active.id) {
      setTitle(active.title);
      setContent(active.content);
      hydratedFor.current = active.id;
    }
  }, [active]);

  const scheduleSave = (patch: Partial<IdeaNote>) => {
    if (!active) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      update.mutate({ id: active.id, patch });
    }, 600);
  };

  const filtered = notes.filter((n) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  const handleCreate = async () => {
    const created = await create.mutateAsync({ title: "Untitled note", content: "" });
    setActiveId(created.id);
    hydratedFor.current = null;
  };

  const handleDelete = async () => {
    if (!active || !window.confirm("Delete this note?")) return;
    await remove.mutateAsync(active.id);
    setActiveId(null);
    hydratedFor.current = null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-16rem)] min-h-[480px]">
      {/* List */}
      <div className="border rounded-xl bg-card flex flex-col min-h-0">
        <div className="p-3 border-b space-y-2">
          <Button onClick={handleCreate} size="sm" className="w-full justify-start gap-2">
            <Plus className="h-4 w-4" /> New note
          </Button>
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes"
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No notes yet</p>
            ) : (
              filtered.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setActiveId(n.id);
                    hydratedFor.current = null;
                  }}
                  className={cn(
                    "w-full text-left rounded-lg px-2.5 py-2 text-sm transition-colors",
                    n.id === activeId ? "bg-accent" : "hover:bg-accent/50",
                  )}
                >
                  <div className="font-medium truncate">{n.title || "Untitled"}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(n.updated_at), { addSuffix: true })}
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Editor */}
      <div className="border rounded-xl bg-card flex flex-col min-h-0">
        {active ? (
          <>
            <div className="p-3 border-b flex items-center gap-2">
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  scheduleSave({ title: e.target.value });
                }}
                placeholder="Note title"
                className="border-0 shadow-none text-base font-semibold focus-visible:ring-0"
              />
              <Button variant="ghost" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <Textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                scheduleSave({ content: e.target.value });
              }}
              placeholder="Start writing… (supports markdown)"
              className="flex-1 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-4 text-sm leading-relaxed"
            />
            <div className="px-4 py-2 border-t text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Auto-saves as you type</span>
              <span>{content.length} chars</span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
            <FileText className="h-8 w-8 opacity-40" />
            <p>Select or create a note to get started.</p>
            <Button size="sm" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" /> New note
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}