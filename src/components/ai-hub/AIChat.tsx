import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Loader2, Copy, Check, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAIChatStream, type StreamMessage } from "@/hooks/useAIChatStream";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMemory } from "@/hooks/useUserMemory";
import { useActiveWorkspace } from "@/contexts/ActiveWorkspaceContext";
import {
  useAIConversations,
  useConversationMessages,
  useSaveMessage,
} from "@/hooks/useAIConversations";
import { getModule, type AIModuleKey } from "@/lib/aiModules";
import { cn } from "@/lib/utils";

interface Props {
  moduleKey: AIModuleKey;
  conversationId: string | null;
  workspaceId?: string | null;
  workspaceContext?: Record<string, unknown> | null;
  /** If true, do not navigate after creating a conversation (workspace embed mode). */
  embedded?: boolean;
  /** Override the navigation prefix when creating a new conversation. */
  baseHref?: string;
}

export function AIChat({
  moduleKey,
  conversationId,
  workspaceId = null,
  workspaceContext = null,
  embedded = false,
  baseHref = "/dashboard/ai",
}: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: memory } = useUserMemory();
  const { activeWorkspace } = useActiveWorkspace();
  // When embedded inside a workspace, use the explicit workspaceId.
  // Otherwise fall back to the user's active workspace from AI Hub.
  const effectiveWorkspaceId = workspaceId ?? (embedded ? null : activeWorkspace?.id ?? null);
  const effectiveWorkspaceName =
    (workspaceContext as { idea_name?: string; workspace?: { idea_name?: string } } | null)?.idea_name ??
    (workspaceContext as { workspace?: { idea_name?: string } } | null)?.workspace?.idea_name ??
    activeWorkspace?.idea_name ??
    null;
  const mod = getModule(moduleKey);
  const { create, update } = useAIConversations(moduleKey);
  const { data: stored = [] } = useConversationMessages(conversationId);
  const saveMessage = useSaveMessage();
  const { stream, isStreaming } = useAIChatStream();

  const [draft, setDraft] = useState<StreamMessage[]>([]);
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Reset local draft when conversation changes
  useEffect(() => {
    setDraft([]);
  }, [conversationId]);

  const messages: StreamMessage[] = useMemo(() => {
    const base: StreamMessage[] = stored
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    return [...base, ...draft];
  }, [stored, draft]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const handleSend = async (override?: string) => {
    const content = (override ?? input).trim();
    if (!content || isStreaming) return;
    setInput("");

    // Ensure we have a conversation (create silently — do not navigate mid-stream)
    let convId = conversationId;
    let createdNew = false;
    if (!convId) {
      try {
        const created = await create.mutateAsync({
          moduleType: moduleKey,
          title: content.slice(0, 60),
          workspaceId,
        });
        convId = created.id;
        createdNew = true;
      } catch (e) {
        toast({ title: "Couldn't start chat", variant: "destructive" });
        return;
      }
    }

    const userMsg: StreamMessage = { role: "user", content };
    setDraft((d) => [...d, userMsg, { role: "assistant", content: "" }]);
    await saveMessage({ conversationId: convId!, role: "user", content });

    let acc = "";
    const finalText = await stream({
      moduleType: moduleKey,
      history: [...messages, userMsg],
      workspaceContext,
      workspaceId: effectiveWorkspaceId,
      userId: user?.id ?? null,
      conversationId: convId,
      onDelta: (chunk) => {
        acc += chunk;
        setDraft((d) => {
          const next = [...d];
          if (next.length && next[next.length - 1].role === "assistant") {
            next[next.length - 1] = { role: "assistant", content: acc };
          }
          return next;
        });
      },
    });

    if (finalText) {
      await saveMessage({ conversationId: convId!, role: "assistant", content: finalText });
      // Auto-title from first exchange
      if (stored.length === 0 && draft.length <= 2) {
        update.mutate({ id: convId!, patch: { title: content.slice(0, 60) } });
      }
    }

    // After stream completes, swap URL to the conversation route so reloads work.
    if (createdNew && !embedded) {
      navigate(`${baseHref}/${moduleKey}/${convId}`, { replace: true });
    }
  };

  const copyMsg = async (content: string, i: number) => {
    await navigator.clipboard.writeText(content);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  const Icon = mod.icon;
  const empty = messages.length === 0;

  const hasWorkspace = !!effectiveWorkspaceId;
  const memoryActive = !!(memory?.memory_summary || memory?.startup_name || memory?.startup_stage);
  const ctxLabel = hasWorkspace
    ? `Workspace: ${effectiveWorkspaceName ?? "Active"} · Knowledge: Connected`
    : memory?.startup_name
      ? `General · ${memory.startup_name}`
      : memory?.startup_stage
        ? `General · ${memory.startup_stage}`
        : "General mode";

  return (
    <div className="flex flex-col h-full min-h-0">
      <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {empty ? (
            <div className="flex flex-col items-center text-center pt-10 sm:pt-16">
              <div className={cn("h-16 w-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg", mod.accent)}>
                <Icon className="h-8 w-8 text-white" />
              </div>
              <h2 className="mt-5 text-2xl sm:text-3xl font-bold tracking-tight">
                {mod.title}
              </h2>
              <p className="mt-2 text-muted-foreground max-w-md">{mod.description}</p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                {mod.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-left text-sm rounded-xl border bg-card hover:bg-accent/40 transition-colors px-4 py-3"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex gap-3 group", m.role === "user" ? "justify-end" : "justify-start")}>
                  {m.role === "assistant" && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className={cn("bg-gradient-to-br text-white", mod.accent)}>
                        <Icon className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn("max-w-[85%] min-w-0", m.role === "user" ? "items-end" : "items-start")}>
                    {m.role === "user" ? (
                      <div className="rounded-2xl px-4 py-2.5 bg-primary text-primary-foreground whitespace-pre-wrap text-sm">
                        {m.content}
                      </div>
                    ) : (
                      <div className="text-foreground">
                        {m.content ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {m.content && (
                          <button
                            onClick={() => copyMsg(m.content, i)}
                            className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {copied === i ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                            {copied === i ? "Copied" : "Copy"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {m.role === "user" && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-secondary"><UserIcon className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-[11px] rounded-full px-2.5 py-0.5 border",
                hasWorkspace
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  hasWorkspace ? "bg-emerald-500" : "bg-muted-foreground/60",
                )}
              />
              {ctxLabel}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-[11px] rounded-full px-2.5 py-0.5 border",
                memoryActive
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-muted text-muted-foreground",
              )}
              title={memory?.memory_summary ?? "No long-term memory yet"}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  memoryActive ? "bg-primary" : "bg-muted-foreground/60",
                )}
              />
              Memory: {memoryActive ? "Active" : "Learning"}
            </span>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4"
        >
          <div className="relative rounded-2xl border bg-card focus-within:ring-2 focus-within:ring-ring transition-shadow">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={mod.placeholder}
              className="min-h-[56px] max-h-40 resize-none border-0 bg-transparent pr-14 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isStreaming}
              size="icon"
              className="absolute right-2 bottom-2 h-9 w-9 rounded-xl"
            >
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground text-center">
            CONTRIVERS AI · {mod.title} · Press Enter to send, Shift+Enter for newline
          </p>
        </form>
      </div>
    </div>
  );
}