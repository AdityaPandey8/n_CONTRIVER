
-- Idea Workspaces: extends ideas with workspace-level tracking
CREATE TABLE public.idea_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  idea_name text NOT NULL,
  one_liner text,
  domain text NOT NULL DEFAULT 'General',
  stage text NOT NULL DEFAULT 'idea',
  progress_percent integer NOT NULL DEFAULT 0,
  health_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.idea_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workspaces" ON public.idea_workspaces
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all workspaces" ON public.idea_workspaces
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Idea Details: structured foundation data per workspace
CREATE TABLE public.idea_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.idea_workspaces(id) ON DELETE CASCADE NOT NULL,
  section text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, section)
);

ALTER TABLE public.idea_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own idea details" ON public.idea_details
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.idea_workspaces w WHERE w.id = idea_details.workspace_id AND w.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea_workspaces w WHERE w.id = idea_details.workspace_id AND w.user_id = auth.uid()));

-- Idea Tasks: to-do items per workspace
CREATE TABLE public.idea_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.idea_workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'todo',
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.idea_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own idea tasks" ON public.idea_tasks
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Idea Documents: file vault per workspace
CREATE TABLE public.idea_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.idea_workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.idea_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own idea documents" ON public.idea_documents
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Idea Feedback: mentor/community comments per workspace
CREATE TABLE public.idea_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.idea_workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  feedback_type text NOT NULL DEFAULT 'comment',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.idea_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create feedback" ON public.idea_feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view feedback" ON public.idea_feedback
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can delete own feedback" ON public.idea_feedback
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Idea Validations: AI scoring results
CREATE TABLE public.idea_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.idea_workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  overall_score integer NOT NULL DEFAULT 0,
  breakdown jsonb NOT NULL DEFAULT '{}',
  suggestions jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.idea_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own validations" ON public.idea_validations
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Storage bucket for idea documents
INSERT INTO storage.buckets (id, name, public) VALUES ('idea-documents', 'idea-documents', false);

CREATE POLICY "Users can upload idea documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'idea-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own idea documents" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'idea-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own idea documents" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'idea-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Triggers for updated_at
CREATE TRIGGER update_idea_workspaces_updated_at BEFORE UPDATE ON public.idea_workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_idea_details_updated_at BEFORE UPDATE ON public.idea_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_idea_tasks_updated_at BEFORE UPDATE ON public.idea_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
