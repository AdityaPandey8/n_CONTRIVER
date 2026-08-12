DROP INDEX IF EXISTS public.hackathons_source_external_uidx;
ALTER TABLE public.hackathons
  ADD CONSTRAINT hackathons_source_external_key UNIQUE (source_slug, external_id);