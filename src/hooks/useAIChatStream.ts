import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AIModuleKey } from "@/lib/aiModules";

export interface StreamMessage {
  role: "user" | "assistant";
  content: string;
}

export function useAIChatStream() {
  const { toast } = useToast();
  const [isStreaming, setIsStreaming] = useState(false);

  const stream = useCallback(
    async (input: {
      moduleType: AIModuleKey;
      history: StreamMessage[];
      workspaceContext?: Record<string, unknown> | null;
      workspaceId?: string | null;
      userId?: string | null;
      conversationId?: string | null;
      onDelta: (chunk: string) => void;
    }): Promise<string> => {
      setIsStreaming(true);
      let assistant = "";
      try {
        const session = (await supabase.auth.getSession()).data.session;
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
            },
            body: JSON.stringify({
              moduleType: input.moduleType,
              messages: input.history,
              workspaceContext: input.workspaceContext ?? null,
              workspaceId: input.workspaceId ?? null,
              userId: input.userId ?? null,
              conversationId: input.conversationId ?? null,
            }),
          },
        );

        if (!res.ok) {
          let err = "Failed to send";
          try {
            const j = await res.json();
            err = j.error ?? err;
          } catch {/* ignore */}
          throw new Error(err);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream");
        const dec = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const j = JSON.parse(data);
              const delta = j.choices?.[0]?.delta?.content;
              if (delta) {
                assistant += delta;
                input.onDelta(delta);
              }
            } catch {/* skip */}
          }
        }
      } catch (e) {
        toast({
          title: "AI error",
          description: e instanceof Error ? e.message : "Failed",
          variant: "destructive",
        });
      } finally {
        setIsStreaming(false);
      }
      return assistant;
    },
    [toast],
  );

  return { stream, isStreaming };
}