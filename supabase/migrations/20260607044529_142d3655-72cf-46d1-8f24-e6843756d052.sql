
-- 1) Extend user_ai_memory with persistent startup profile fields
ALTER TABLE public.user_ai_memory
  ADD COLUMN IF NOT EXISTS startup_name text,
  ADD COLUMN IF NOT EXISTS startup_description text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS target_users text,
  ADD COLUMN IF NOT EXISTS goals text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_ai_style text;

-- 2) workspace_cache_version: bumped on any workspace data change
CREATE TABLE IF NOT EXISTS public.workspace_cache_version (
  workspace_id uuid PRIMARY KEY,
  version bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.workspace_cache_version TO authenticated;
GRANT ALL ON public.workspace_cache_version TO service_role;

ALTER TABLE public.workspace_cache_version ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read own cache version"
ON public.workspace_cache_version
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.idea_workspaces w
    WHERE w.id = workspace_cache_version.workspace_id
      AND w.user_id = auth.uid()
  )
);

-- 3) Trigger function: bump version on workspace-related writes
CREATE OR REPLACE FUNCTION public.bump_workspace_cache_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wid uuid;
BEGIN
  -- Resolve workspace_id from the row (varies by table)
  IF TG_TABLE_NAME = 'idea_workspaces' THEN
    wid := COALESCE(NEW.id, OLD.id);
  ELSE
    wid := COALESCE(NEW.workspace_id, OLD.workspace_id);
  END IF;

  IF wid IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO public.workspace_cache_version (workspace_id, version, updated_at)
  VALUES (wid, 1, now())
  ON CONFLICT (workspace_id)
  DO UPDATE SET version = workspace_cache_version.version + 1,
                updated_at = now();

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4) Attach trigger to workspace data tables
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'idea_workspaces',
    'idea_details',
    'idea_versions',
    'idea_validations',
    'pitch_decks',
    'idea_tasks',
    'idea_notes',
    'idea_documents'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_bump_cache_version ON public.%I;', t
    );
    EXECUTE format(
      'CREATE TRIGGER trg_bump_cache_version
         AFTER INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.bump_workspace_cache_version();', t
    );
  END LOOP;
END $$;
