import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function useAIChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Fetch session history
  const { data: sessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ["ai-chat-sessions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("ai_chat_sessions")
        .select("id, title, session_type, created_at, updated_at")
        .eq("user_id", user.id)
        .eq("session_type", "mentor")
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const saveSession = useCallback(async (msgs?: Message[], title?: string) => {
    if (!user || (!msgs && messages.length === 0)) return;
    const toSave = msgs || messages;
    if (toSave.length === 0) return;

    const sessionTitle = title || toSave.find(m => m.role === "user")?.content?.substring(0, 60) || "Chat Session";

    try {
      if (currentSessionId) {
        await supabase
          .from("ai_chat_sessions")
          .update({ messages: toSave as any, title: sessionTitle, updated_at: new Date().toISOString() })
          .eq("id", currentSessionId);
      } else {
        const { data } = await supabase
          .from("ai_chat_sessions")
          .insert({
            user_id: user.id,
            session_type: "mentor",
            title: sessionTitle,
            messages: toSave as any,
          })
          .select("id")
          .single();
        if (data) setCurrentSessionId(data.id);
      }
      refetchSessions();
    } catch (err) {
      console.error("Failed to save session:", err);
    }
  }, [user, messages, currentSessionId, refetchSessions]);

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from("ai_chat_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      if (error) throw error;
      if (data) {
        setMessages(data.messages as any as Message[]);
        setCurrentSessionId(data.id);
      }
    } catch (err) {
      toast({ title: "Failed to load session", variant: "destructive" });
    }
  }, [toast]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = { role: "user", content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    let assistantContent = "";

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-mentor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(user ? { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` } : {}),
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const deltaContent = parsed.choices?.[0]?.delta?.content;
              if (deltaContent) {
                assistantContent += deltaContent;
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  if (newMessages[lastIndex]?.role === "assistant") {
                    newMessages[lastIndex] = { role: "assistant", content: assistantContent };
                  }
                  return newMessages;
                });
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      // Auto-save after each message exchange
      const finalMessages = [...messages, userMessage, { role: "assistant" as const, content: assistantContent }];
      setTimeout(() => saveSession(finalMessages), 500);
    } catch (error: any) {
      console.error("AI Chat error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      const isQuotaError = errorMessage.includes("429") || errorMessage.toLowerCase().includes("quota");
      
      toast({
        title: isQuotaError ? "AI Temporarily Unavailable" : "Error",
        description: isQuotaError 
          ? "AI features are experiencing high demand. Please try again in a few minutes."
          : errorMessage,
        variant: "destructive",
      });
      setMessages(prev => prev.filter((_, i) => i !== prev.length - 1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, user, toast, saveSession]);

  const clearMessages = useCallback(() => {
    // Save current session before clearing
    if (messages.length > 0) {
      saveSession();
    }
    setMessages([]);
    setCurrentSessionId(null);
  }, [messages, saveSession]);

  const startNewChat = useCallback(() => {
    if (messages.length > 0) {
      saveSession();
    }
    setMessages([]);
    setCurrentSessionId(null);
  }, [messages, saveSession]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    startNewChat,
    sessions,
    loadSession,
    currentSessionId,
  };
}

export function useStrategyBuilder() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const generateStrategy = useCallback(async (params: {
    ideaDescription: string;
    targetMarket?: string;
    budgetConstraints?: string;
    ideaId?: string;
  }) => {
    setIsLoading(true);

    try {
      const session = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strategy-builder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session?.access_token}`,
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate strategy");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Strategy Builder error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate strategy",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return { generateStrategy, isLoading };
}

export function usePitchFeedback() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const analyzePitch = useCallback(async (params: {
    pitchContent: string;
    targetAudience?: string;
    fundingStage?: string;
    startupId?: string;
  }) => {
    setIsLoading(true);

    try {
      const session = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pitch-feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session?.access_token}`,
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to analyze pitch");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Pitch Feedback error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze pitch",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const regeneratePitch = useCallback(async (params: {
    originalPitch: string;
    feedback: any;
    targetAudience?: string;
    fundingStage?: string;
  }) => {
    setIsLoading(true);

    try {
      const session = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pitch-regenerator`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session?.access_token}`,
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to regenerate pitch");
      }

      return await response.json();
    } catch (error) {
      console.error("Pitch Regenerator error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to regenerate pitch",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return { analyzePitch, regeneratePitch, isLoading };
}

export function useIdeaGenerator() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const generateIdeas = useCallback(async (params: {
    domain: string;
    problemArea?: string;
    constraints?: string;
    budgetConstraints?: string;
    count?: number;
  }) => {
    setIsLoading(true);

    try {
      const session = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/idea-generator`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session.data.session ? { Authorization: `Bearer ${session.data.session.access_token}` } : {}),
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate ideas");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Idea Generator error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate ideas",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return { generateIdeas, isLoading };
}

// History hooks
export function useStrategyHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["strategy-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("strategy_plans")
        .select("id, title, idea_description, target_market, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function usePitchHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["pitch-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("pitch_feedback")
        .select("id, pitch_content, clarity_score, persuasiveness_score, target_audience, funding_stage, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}
