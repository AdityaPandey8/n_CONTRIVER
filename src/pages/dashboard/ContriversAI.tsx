import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AIHubLayout } from "@/components/ai-hub/AIHubLayout";
import { AIChat } from "@/components/ai-hub/AIChat";
import { AI_MODULES, QUICK_ACTIONS, type AIModuleKey, getModule } from "@/lib/aiModules";
import { cn } from "@/lib/utils";
import { useAIConversations } from "@/hooks/useAIConversations";

function HomeScreen() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const { create } = useAIConversations("mentor");

  const startWith = async (moduleKey: AIModuleKey, prompt: string) => {
    if (!prompt.trim()) {
      navigate(`/dashboard/ai/${moduleKey}`);
      return;
    }
    const created = await create.mutateAsync({
      moduleType: moduleKey,
      title: prompt.slice(0, 60),
    });
    navigate(`/dashboard/ai/${moduleKey}/${created.id}`, {
      state: { initialPrompt: prompt },
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background via-background to-accent/10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            CONTRIVERS AI
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            How can CONTRIVERS AI help you today?
          </h1>
          <p className="mt-3 text-muted-foreground">
            Your unified AI operating system for innovators and founders.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            startWith("mentor", text);
          }}
          className="relative"
        >
          <div className="rounded-2xl border bg-card shadow-lg focus-within:ring-2 focus-within:ring-ring">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  startWith("mentor", text);
                }
              }}
              placeholder="Ask anything — validate an idea, analyze a market, build a strategy…"
              className="min-h-[88px] border-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            />
            <div className="flex items-center justify-between p-2.5 border-t">
              <span className="text-xs text-muted-foreground pl-2">
                Starts a new AI Mentor chat
              </span>
              <Button type="submit" size="sm" className="rounded-lg">
                Start <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {QUICK_ACTIONS.map((q) => (
            <button
              key={q.label}
              onClick={() => startWith(q.module, q.prompt)}
              className="text-xs sm:text-sm px-3 py-1.5 rounded-full border bg-card hover:bg-accent/50 transition-colors"
            >
              {q.label}
            </button>
          ))}
        </div>

        <div className="mt-12">
          <h2 className="text-lg font-semibold mb-4">AI Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {AI_MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.key}
                  onClick={() => navigate(`/dashboard/ai/${m.key}`)}
                  className="group text-left rounded-2xl border bg-card hover:bg-accent/30 hover:shadow-md transition-all p-4"
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-sm",
                      m.accent,
                    )}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="font-semibold">{m.title}</div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {m.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContriversAI() {
  const { moduleKey, conversationId } = useParams<{
    moduleKey?: string;
    conversationId?: string;
  }>();

  if (!moduleKey) {
    return <HomeScreen />;
  }

  const mod = getModule(moduleKey);

  return (
    <AIHubLayout
      moduleKey={mod.key}
      conversationId={conversationId ?? null}
    >
      <AIChat moduleKey={mod.key} conversationId={conversationId ?? null} />
    </AIHubLayout>
  );
}