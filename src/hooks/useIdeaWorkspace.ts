import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface IdeaWorkspace {
  id: string;
  user_id: string;
  idea_name: string;
  one_liner: string | null;
  domain: string;
  stage: string;
  progress_percent: number;
  health_score: number | null;
  created_at: string;
  updated_at: string;
}

const STAGES = ["idea", "validation", "mvp", "pitch", "launch"];

export function useIdeaWorkspaces() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ["idea-workspaces", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("idea_workspaces")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as IdeaWorkspace[];
    },
    enabled: !!user,
  });

  const createWorkspace = useMutation({
    mutationFn: async (input: { idea_name: string; one_liner?: string; domain: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("idea_workspaces")
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["idea-workspaces"] });
      toast({ title: "Idea workspace created!" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteWorkspace = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("idea_workspaces").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["idea-workspaces"] });
      toast({ title: "Workspace deleted" });
    },
  });

  return { workspaces, isLoading, createWorkspace, deleteWorkspace, STAGES };
}

export function useWorkspaceDetail(workspaceId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: workspace, isLoading } = useQuery({
    queryKey: ["workspace-detail", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      const { data, error } = await supabase
        .from("idea_workspaces")
        .select("*")
        .eq("id", workspaceId)
        .single();
      if (error) throw error;
      return data as IdeaWorkspace;
    },
    enabled: !!workspaceId,
  });

  const updateWorkspace = useMutation({
    mutationFn: async (updates: Partial<IdeaWorkspace>) => {
      if (!workspaceId) throw new Error("No workspace");
      const { error } = await supabase
        .from("idea_workspaces")
        .update(updates)
        .eq("id", workspaceId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspace-detail", workspaceId] });
      qc.invalidateQueries({ queryKey: ["idea-workspaces"] });
    },
  });

  // Idea Details sections
  const { data: details = {} } = useQuery({
    queryKey: ["workspace-details", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return {};
      const { data, error } = await supabase
        .from("idea_details")
        .select("*")
        .eq("workspace_id", workspaceId);
      if (error) throw error;
      const map: Record<string, any> = {};
      data.forEach((d: any) => { map[d.section] = d.data; });
      return map;
    },
    enabled: !!workspaceId,
  });

  const saveDetail = useMutation({
    mutationFn: async ({ section, data }: { section: string; data: any }) => {
      if (!workspaceId) throw new Error("No workspace");
      const { error } = await supabase
        .from("idea_details")
        .upsert({ workspace_id: workspaceId, section, data }, { onConflict: "workspace_id,section" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspace-details", workspaceId] });
      toast({ title: "Saved!" });
    },
  });

  // Tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["workspace-tasks", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from("idea_tasks")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });

  const createTask = useMutation({
    mutationFn: async (input: { title: string; description?: string; priority?: string; due_date?: string }) => {
      if (!user || !workspaceId) throw new Error("Missing context");
      const { error } = await supabase.from("idea_tasks").insert({
        ...input,
        workspace_id: workspaceId,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspace-tasks", workspaceId] }),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("idea_tasks").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspace-tasks", workspaceId] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("idea_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspace-tasks", workspaceId] }),
  });

  // Documents
  const { data: documents = [] } = useQuery({
    queryKey: ["workspace-documents", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from("idea_documents")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });

  const uploadDocument = useMutation({
    mutationFn: async (file: File) => {
      if (!user || !workspaceId) throw new Error("Missing context");
      const filePath = `${user.id}/${workspaceId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("idea-documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("idea-documents").getPublicUrl(filePath);
      const { error } = await supabase.from("idea_documents").insert({
        workspace_id: workspaceId,
        user_id: user.id,
        name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspace-documents", workspaceId] });
      toast({ title: "Document uploaded!" });
    },
    onError: (e: Error) => toast({ title: "Upload failed", description: e.message, variant: "destructive" }),
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("idea_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspace-documents", workspaceId] }),
  });

  // Feedback
  const { data: feedback = [] } = useQuery({
    queryKey: ["workspace-feedback", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from("idea_feedback")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const userIds = [...new Set(data.map((f: any) => f.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds);
      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);
      return data.map((f: any) => ({ ...f, author: profileMap.get(f.user_id) }));
    },
    enabled: !!workspaceId,
  });

  const addFeedback = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !workspaceId) throw new Error("Missing context");
      const { error } = await supabase.from("idea_feedback").insert({
        workspace_id: workspaceId,
        user_id: user.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspace-feedback", workspaceId] }),
  });

  // Validations
  const { data: validations = [] } = useQuery({
    queryKey: ["workspace-validations", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from("idea_validations")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });

  return {
    workspace, isLoading, updateWorkspace,
    details, saveDetail,
    tasks, tasksLoading, createTask, updateTask, deleteTask,
    documents, uploadDocument, deleteDocument,
    feedback, addFeedback,
    validations,
    STAGES,
  };
}
