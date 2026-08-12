CREATE TABLE public.user_ai_memory (
  user_id uuid PRIMARY KEY,
  role text,
  interests text[] NOT NULL DEFAULT '{}',
  startup_stage text,
  preferred_industry text,
  memory_summary text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_ai_memory TO authenticated;
GRANT ALL ON public.user_ai_memory TO service_role;

ALTER TABLE public.user_ai_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own memory row"
ON public.user_ai_memory
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_ai_memory_updated_at
BEFORE UPDATE ON public.user_ai_memory
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();