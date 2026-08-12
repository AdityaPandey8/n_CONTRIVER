
-- ai_cache
CREATE TABLE public.ai_cache (
  key TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read cache" ON public.ai_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone authenticated can write cache" ON public.ai_cache FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone authenticated can update cache" ON public.ai_cache FOR UPDATE TO authenticated USING (true);

-- idea_versions
CREATE TABLE public.idea_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  idea_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INTEGER NOT NULL DEFAULT 0,
  confidence INTEGER NOT NULL DEFAULT 0,
  risk TEXT NOT NULL DEFAULT 'medium',
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  diff_from_prev JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_idea_versions_workspace ON public.idea_versions(workspace_id, version DESC);
ALTER TABLE public.idea_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own idea versions" ON public.idea_versions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all idea versions" ON public.idea_versions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- risk_analysis
CREATE TABLE public.risk_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  version_id UUID,
  user_id UUID NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  rule_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_risks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.risk_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own risk" ON public.risk_analysis FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ai_context_memory
CREATE TABLE public.ai_context_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'innovator',
  summary TEXT,
  last_stage TEXT,
  last_score INTEGER,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.ai_context_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own memory" ON public.ai_context_memory FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- match_scores
CREATE TABLE public.match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);
ALTER TABLE public.match_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own matches" ON public.match_scores FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Extend idea_validations
ALTER TABLE public.idea_validations
  ADD COLUMN IF NOT EXISTS confidence INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_level TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS version_id UUID;
