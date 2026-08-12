
-- 1. Extend hackathons with discovery/aggregation fields
ALTER TABLE public.hackathons
  ADD COLUMN IF NOT EXISTS source_slug text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS dedupe_hash text,
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS themes text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS team_size_min int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS team_size_max int DEFAULT 4,
  ADD COLUMN IF NOT EXISTS prize_pool_inr bigint,
  ADD COLUMN IF NOT EXISTS prize_pool_text text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS registration_url text,
  ADD COLUMN IF NOT EXISTS is_student_only boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_beginner_friendly boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS allows_solo boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS popularity_score int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS saves_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS views_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_seen_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS raw jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS hackathons_source_external_uniq
  ON public.hackathons (source_slug, external_id)
  WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS hackathons_dedupe_hash_uniq
  ON public.hackathons (dedupe_hash)
  WHERE dedupe_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS hackathons_status_deadline_idx
  ON public.hackathons (status, registration_deadline);
CREATE INDEX IF NOT EXISTS hackathons_themes_gin
  ON public.hackathons USING gin (themes);
CREATE INDEX IF NOT EXISTS hackathons_tags_gin
  ON public.hackathons USING gin (tags);

-- Make hackathons publicly readable (HackRadar is a discovery surface)
DROP POLICY IF EXISTS "Hackathons publicly readable" ON public.hackathons;
CREATE POLICY "Hackathons publicly readable" ON public.hackathons FOR SELECT USING (true);
GRANT SELECT ON public.hackathons TO anon;

-- 2. Profile fields for teammate matching
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tech_stack text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS portfolio_url text,
  ADD COLUMN IF NOT EXISTS availability text,
  ADD COLUMN IF NOT EXISTS timezone text;

-- 3. hackathon_sources
CREATE TABLE IF NOT EXISTS public.hackathon_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  type text NOT NULL,
  base_url text,
  is_active boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_run_at timestamptz,
  last_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hackathon_sources TO anon, authenticated;
GRANT ALL ON public.hackathon_sources TO service_role;
ALTER TABLE public.hackathon_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sources readable by all" ON public.hackathon_sources FOR SELECT USING (true);
CREATE POLICY "Admins manage sources" ON public.hackathon_sources FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.hackathon_sources (slug, display_name, type, base_url) VALUES
  ('user',        'User submissions', 'user',   null),
  ('manual',      'Manual / Admin',   'manual', null),
  ('devpost',     'Devpost',          'rss',    'https://devpost.com'),
  ('devfolio',    'Devfolio',         'scrape', 'https://devfolio.co'),
  ('unstop',      'Unstop',           'scrape', 'https://unstop.com'),
  ('reskilll',    'Reskilll',         'scrape', 'https://reskilll.com'),
  ('hackerearth', 'HackerEarth',      'scrape', 'https://hackerearth.com')
ON CONFLICT (slug) DO NOTHING;

-- 4. Saves & watchlists
CREATE TABLE IF NOT EXISTS public.hackathon_saves (
  user_id uuid NOT NULL,
  hackathon_id uuid NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, hackathon_id)
);
GRANT SELECT, INSERT, DELETE ON public.hackathon_saves TO authenticated;
GRANT ALL ON public.hackathon_saves TO service_role;
ALTER TABLE public.hackathon_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saves" ON public.hackathon_saves FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.hackathon_watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hackathon_watchlists TO authenticated;
GRANT ALL ON public.hackathon_watchlists TO service_role;
ALTER TABLE public.hackathon_watchlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own watchlists" ON public.hackathon_watchlists FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.hackathon_watchlist_items (
  watchlist_id uuid NOT NULL REFERENCES public.hackathon_watchlists(id) ON DELETE CASCADE,
  hackathon_id uuid NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (watchlist_id, hackathon_id)
);
GRANT SELECT, INSERT, DELETE ON public.hackathon_watchlist_items TO authenticated;
GRANT ALL ON public.hackathon_watchlist_items TO service_role;
ALTER TABLE public.hackathon_watchlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own watchlist items" ON public.hackathon_watchlist_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.hackathon_watchlists w WHERE w.id = watchlist_id AND w.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.hackathon_watchlists w WHERE w.id = watchlist_id AND w.user_id = auth.uid()));

-- 5. Alerts
CREATE TABLE IF NOT EXISTS public.hackathon_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  hackathon_id uuid NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  alert_type text NOT NULL DEFAULT 'deadline',
  fire_at timestamptz NOT NULL,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hackathon_alerts_due_idx ON public.hackathon_alerts (fire_at) WHERE sent_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hackathon_alerts TO authenticated;
GRANT ALL ON public.hackathon_alerts TO service_role;
ALTER TABLE public.hackathon_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own alerts" ON public.hackathon_alerts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Teams
CREATE TABLE IF NOT EXISTS public.hackathon_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id uuid NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  name text NOT NULL,
  pitch text,
  looking_for text[] DEFAULT '{}',
  required_skills text[] DEFAULT '{}',
  max_size int DEFAULT 4,
  is_open boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hackathon_teams TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hackathon_teams TO authenticated;
GRANT ALL ON public.hackathon_teams TO service_role;
ALTER TABLE public.hackathon_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teams readable by all" ON public.hackathon_teams FOR SELECT USING (true);
CREATE POLICY "Owners insert teams" ON public.hackathon_teams FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update teams" ON public.hackathon_teams FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners delete teams" ON public.hackathon_teams FOR DELETE USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.hackathon_team_members (
  team_id uuid NOT NULL REFERENCES public.hackathon_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text DEFAULT 'member',
  status text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);
GRANT SELECT ON public.hackathon_team_members TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.hackathon_team_members TO authenticated;
GRANT ALL ON public.hackathon_team_members TO service_role;
ALTER TABLE public.hackathon_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members readable" ON public.hackathon_team_members FOR SELECT USING (true);
CREATE POLICY "Owner or self manage member" ON public.hackathon_team_members FOR ALL
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.hackathon_teams t WHERE t.id = team_id AND t.owner_id = auth.uid()))
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.hackathon_teams t WHERE t.id = team_id AND t.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.hackathon_team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.hackathon_teams(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL,
  invitee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hackathon_team_invites TO authenticated;
GRANT ALL ON public.hackathon_team_invites TO service_role;
ALTER TABLE public.hackathon_team_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Invites seen by parties" ON public.hackathon_team_invites FOR SELECT
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);
CREATE POLICY "Inviter creates invites" ON public.hackathon_team_invites FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);
CREATE POLICY "Parties update invites" ON public.hackathon_team_invites FOR UPDATE
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);
CREATE POLICY "Parties delete invites" ON public.hackathon_team_invites FOR DELETE
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE TABLE IF NOT EXISTS public.hackathon_team_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.hackathon_teams(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hackathon_team_applications TO authenticated;
GRANT ALL ON public.hackathon_team_applications TO service_role;
ALTER TABLE public.hackathon_team_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Apps seen by applicant or owner" ON public.hackathon_team_applications FOR SELECT
  USING (auth.uid() = applicant_id OR EXISTS (SELECT 1 FROM public.hackathon_teams t WHERE t.id = team_id AND t.owner_id = auth.uid()));
CREATE POLICY "Applicant creates" ON public.hackathon_team_applications FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Applicant or owner updates" ON public.hackathon_team_applications FOR UPDATE
  USING (auth.uid() = applicant_id OR EXISTS (SELECT 1 FROM public.hackathon_teams t WHERE t.id = team_id AND t.owner_id = auth.uid()));
CREATE POLICY "Applicant or owner deletes" ON public.hackathon_team_applications FOR DELETE
  USING (auth.uid() = applicant_id OR EXISTS (SELECT 1 FROM public.hackathon_teams t WHERE t.id = team_id AND t.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.hackathon_teammate_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id uuid NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  headline text NOT NULL,
  looking_for_skills text[] DEFAULT '{}',
  role_preference text,
  availability text,
  message text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hackathon_teammate_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.hackathon_teammate_posts TO authenticated;
GRANT ALL ON public.hackathon_teammate_posts TO service_role;
ALTER TABLE public.hackathon_teammate_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teammate posts readable" ON public.hackathon_teammate_posts FOR SELECT USING (true);
CREATE POLICY "Users manage own teammate posts" ON public.hackathon_teammate_posts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. HackRadar preferences
CREATE TABLE IF NOT EXISTS public.hackradar_preferences (
  user_id uuid PRIMARY KEY,
  interests text[] DEFAULT '{}',
  skill_level text DEFAULT 'all',
  preferred_mode text DEFAULT 'any',
  preferred_team_size text DEFAULT 'any',
  city text,
  max_distance_km int,
  notify_deadline_hours int[] DEFAULT '{72,24}',
  notify_new_match boolean DEFAULT true,
  weekly_digest boolean DEFAULT true,
  has_completed_review boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hackradar_preferences TO authenticated;
GRANT ALL ON public.hackradar_preferences TO service_role;
ALTER TABLE public.hackradar_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own prefs" ON public.hackradar_preferences FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. Ingestion runs log
CREATE TABLE IF NOT EXISTS public.hackathon_ingestion_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_slug text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  inserted_count int DEFAULT 0,
  updated_count int DEFAULT 0,
  skipped_count int DEFAULT 0,
  error text
);
GRANT SELECT ON public.hackathon_ingestion_runs TO authenticated;
GRANT ALL ON public.hackathon_ingestion_runs TO service_role;
ALTER TABLE public.hackathon_ingestion_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read ingestion runs" ON public.hackathon_ingestion_runs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 9. Triggers: keep updated_at fresh; maintain saves_count
DROP TRIGGER IF EXISTS trg_hackathon_teams_updated ON public.hackathon_teams;
CREATE TRIGGER trg_hackathon_teams_updated BEFORE UPDATE ON public.hackathon_teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_hackathon_team_invites_updated ON public.hackathon_team_invites;
CREATE TRIGGER trg_hackathon_team_invites_updated BEFORE UPDATE ON public.hackathon_team_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_hackathon_team_applications_updated ON public.hackathon_team_applications;
CREATE TRIGGER trg_hackathon_team_applications_updated BEFORE UPDATE ON public.hackathon_team_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_hackathon_teammate_posts_updated ON public.hackathon_teammate_posts;
CREATE TRIGGER trg_hackathon_teammate_posts_updated BEFORE UPDATE ON public.hackathon_teammate_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_hackradar_preferences_updated ON public.hackradar_preferences;
CREATE TRIGGER trg_hackradar_preferences_updated BEFORE UPDATE ON public.hackradar_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_hackathon_sources_updated ON public.hackathon_sources;
CREATE TRIGGER trg_hackathon_sources_updated BEFORE UPDATE ON public.hackathon_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_hackathon_saves_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.hackathons SET saves_count = saves_count + 1 WHERE id = NEW.hackathon_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.hackathons SET saves_count = GREATEST(saves_count - 1, 0) WHERE id = OLD.hackathon_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_hackathon_saves_count ON public.hackathon_saves;
CREATE TRIGGER trg_hackathon_saves_count
  AFTER INSERT OR DELETE ON public.hackathon_saves
  FOR EACH ROW EXECUTE FUNCTION public.update_hackathon_saves_count();

-- 10. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hackathon_saves;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hackathon_teammate_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hackathon_team_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hackathon_team_invites;
