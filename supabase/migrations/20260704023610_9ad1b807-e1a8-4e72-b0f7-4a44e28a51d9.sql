
-- Enrich hackathons schema for filters + search
ALTER TABLE public.hackathons
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS eligibility text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS ai_classified_at timestamptz,
  ADD COLUMN IF NOT EXISTS searchable_text text,
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('simple', coalesce(searchable_text, ''))) STORED;

-- Ensure unique constraint (idempotent) for upsert onConflict
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hackathons_source_external_key'
  ) THEN
    BEGIN
      ALTER TABLE public.hackathons
        ADD CONSTRAINT hackathons_source_external_key UNIQUE (source_slug, external_id);
    EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL;
    END;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS hackathons_search_tsv_idx ON public.hackathons USING gin (search_tsv);
CREATE INDEX IF NOT EXISTS hackathons_themes_gin ON public.hackathons USING gin (themes);
CREATE INDEX IF NOT EXISTS hackathons_tags_gin ON public.hackathons USING gin (tags);
CREATE INDEX IF NOT EXISTS hackathons_eligibility_gin ON public.hackathons USING gin (eligibility);
CREATE INDEX IF NOT EXISTS hackathons_status_deadline_idx
  ON public.hackathons (status, registration_deadline);
CREATE INDEX IF NOT EXISTS hackathons_mode_idx ON public.hackathons (mode);
CREATE INDEX IF NOT EXISTS hackathons_city_idx ON public.hackathons (city);
CREATE INDEX IF NOT EXISTS hackathons_first_seen_idx ON public.hackathons (first_seen_at DESC);

-- Ingestion run richer logging
ALTER TABLE public.hackathon_ingestion_runs
  ADD COLUMN IF NOT EXISTS records_seen integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_ms integer,
  ADD COLUMN IF NOT EXISTS error_details jsonb DEFAULT '[]'::jsonb;
