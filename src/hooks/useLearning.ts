import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Lesson {
  id: string;
  title: string;
  description: string;
  workspace_tab: string;
  points: number;
  content?: string;
  video_url?: string;
  image_url?: string;
  links?: { title: string; url: string }[];
}

export interface LearningTrack {
  id: string;
  title: string;
  level: string;
  description: string | null;
  lessons: Lesson[];
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  track_id: string;
  completed_lessons: string[];
  points: number;
  streak_days: number;
  last_active: string;
  badges: string[];
  created_at: string;
}

export function useLearning() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: tracks = [], isLoading: tracksLoading } = useQuery({
    queryKey: ["learning-tracks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_tracks")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        lessons: Array.isArray(t.lessons) ? t.lessons : [],
      })) as LearningTrack[];
    },
  });

  const { data: progress = [], isLoading: progressLoading } = useQuery({
    queryKey: ["user-progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        completed_lessons: Array.isArray(p.completed_lessons) ? p.completed_lessons : [],
        badges: Array.isArray(p.badges) ? p.badges : [],
      })) as UserProgress[];
    },
    enabled: !!user,
  });

  const completeLesson = useMutation({
    mutationFn: async ({ trackId, lessonId, points }: { trackId: string; lessonId: string; points: number }) => {
      if (!user) throw new Error("Not authenticated");

      const existing = progress.find(p => p.track_id === trackId);
      if (existing) {
        const completedLessons = [...new Set([...existing.completed_lessons, lessonId])];
        const { error } = await supabase
          .from("user_progress")
          .update({
            completed_lessons: completedLessons as any,
            points: existing.points + points,
            last_active: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_progress").insert({
          user_id: user.id,
          track_id: trackId,
          completed_lessons: [lessonId] as any,
          points,
          last_active: new Date().toISOString(),
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-progress", user?.id] });
      toast({ title: "Lesson completed! 🎉" });
    },
  });

  const verifyLesson = useMutation({
    mutationFn: async ({ lessonId, workspaceTab }: { lessonId: string; workspaceTab: string }) => {
      const { data, error } = await supabase.functions.invoke("lesson-verifier", {
        body: { lesson_id: lessonId, workspace_tab: workspaceTab },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data.verified) {
        toast({ title: "Not verified", description: data.reason, variant: "destructive" });
      }
      return data as { verified: boolean; reason: string };
    },
    onError: (e: Error) => toast({ title: "Verification failed", description: e.message, variant: "destructive" }),
  });

  const totalPoints = progress.reduce((sum, p) => sum + p.points, 0);
  const totalCompleted = progress.reduce((sum, p) => sum + p.completed_lessons.length, 0);
  const streakDays = progress.reduce((max, p) => Math.max(max, p.streak_days), 0);

  return {
    tracks,
    progress,
    tracksLoading,
    progressLoading,
    completeLesson,
    verifyLesson,
    totalPoints,
    totalCompleted,
    streakDays,
  };
}
