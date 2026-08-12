ALTER TABLE public.hackathons ALTER COLUMN creator_id DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS hackathons_source_external_uidx
  ON public.hackathons (source_slug, external_id)
  WHERE source_slug IS NOT NULL AND external_id IS NOT NULL;