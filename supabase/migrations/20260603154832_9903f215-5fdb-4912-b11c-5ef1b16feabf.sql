
-- =========================================================
-- AI Governance + Intelligence tables
-- =========================================================

-- 1. ai_settings (singleton)
CREATE TABLE IF NOT EXISTS public.ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  validation_weights jsonb NOT NULL DEFAULT '{"demand":40,"feasibility":30,"innovation":20,"scalability":10}'::jsonb,
  match_weights jsonb NOT NULL DEFAULT '{"mentor":{"skill":50,"domain":30,"experience":20},"investor":{"industry":50,"stage":30,"funding":20},"idea":{"similarity_threshold":75}}'::jsonb,
  modules_enabled jsonb NOT NULL DEFAULT '{"validation":true,"strategy":true,"chat":true,"match":true}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.ai_settings TO authenticated;
GRANT ALL ON public.ai_settings TO service_role;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read settings" ON public.ai_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage settings" ON public.ai_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.ai_settings (singleton) VALUES (true) ON CONFLICT DO NOTHING;

-- 2. ai_usage_log
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  module text NOT NULL,
  tokens_in integer NOT NULL DEFAULT 0,
  tokens_out integer NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL DEFAULT 0,
  cache_hit boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_usage_log TO authenticated;
GRANT ALL ON public.ai_usage_log TO service_role;
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read usage" ON public.ai_usage_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS ai_usage_log_created_idx ON public.ai_usage_log (created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_log_module_idx ON public.ai_usage_log (module, created_at DESC);

-- 3. platform_insights
CREATE TABLE IF NOT EXISTS public.platform_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  severity text NOT NULL DEFAULT 'info',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_insights TO authenticated;
GRANT ALL ON public.platform_insights TO service_role;
ALTER TABLE public.platform_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read insights" ON public.platform_insights FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS platform_insights_created_idx ON public.platform_insights (created_at DESC);

-- 4. risk_analysis
CREATE TABLE IF NOT EXISTS public.risk_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL,
  level text NOT NULL DEFAULT 'medium',
  score integer NOT NULL DEFAULT 0,
  factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.risk_analysis TO authenticated;
GRANT ALL ON public.risk_analysis TO service_role;
ALTER TABLE public.risk_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own risk" ON public.risk_analysis FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS risk_analysis_workspace_idx ON public.risk_analysis (workspace_id, created_at DESC);

-- 5. broadcast_messages
CREATE TABLE IF NOT EXISTS public.broadcast_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  target_roles text[] NOT NULL DEFAULT '{}',
  recipients_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.broadcast_messages TO authenticated;
GRANT ALL ON public.broadcast_messages TO service_role;
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read broadcasts" ON public.broadcast_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins create broadcasts" ON public.broadcast_messages FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') AND sender_id = auth.uid());

-- =========================================================
-- Realtime: add tables to supabase_realtime publication
-- =========================================================
DO $$
BEGIN
  PERFORM 1 FROM pg_publication WHERE pubname = 'supabase_realtime';
  IF FOUND THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.idea_versions; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.idea_validations; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.risk_analysis; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.match_scores; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_usage_log; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_insights; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;
