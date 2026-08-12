import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getModule } from "@/lib/aiModules";
import { cn } from "@/lib/utils";

interface Conv {
  id: string;
  title: string;
  module_type: string;
  created_at: string;
}
interface Msg {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export default function SharedChat() {
  const { slug } = useParams<{ slug: string }>();
  const [conv, setConv] = useState<Conv | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: c, error: e1 } = await supabase
        .from("ai_conversations")
        .select("id, title, module_type, created_at")
        .eq("share_slug", slug)
        .eq("is_shared", true)
        .maybeSingle();
      if (e1 || !c) {
        setError("Chat not found or no longer shared.");
        setLoading(false);
        return;
      }
      setConv(c as Conv);
      const { data: m } = await supabase
        .from("conversation_messages")
        .select("*")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: true });
      setMessages((m ?? []) as Msg[]);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (error || !conv) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground">{error ?? "Not found"}</p>
        <Link to="/" className="text-primary text-sm hover:underline">Go home</Link>
      </div>
    );
  }

  const mod = getModule(conv.module_type);
  const Icon = mod.icon;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> CONTRIVERS AI
          </Link>
          <Link to="/auth" className="text-xs text-primary hover:underline">Sign in</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span className={cn("h-5 w-5 rounded bg-gradient-to-br flex items-center justify-center", mod.accent)}>
              <Icon className="h-3 w-3 text-white" />
            </span>
            {mod.title} · Shared chat
          </div>
          <h1 className="text-2xl font-bold">{conv.title}</h1>
        </div>
        <div className="space-y-6">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role !== "user" && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className={cn("bg-gradient-to-br text-white", mod.accent)}>
                    <Icon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={cn("max-w-[85%]", m.role === "user" ? "rounded-2xl bg-primary text-primary-foreground px-4 py-2.5 text-sm whitespace-pre-wrap" : "prose prose-sm dark:prose-invert max-w-none")}>
                {m.role === "user" ? m.content : <ReactMarkdown>{m.content}</ReactMarkdown>}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}