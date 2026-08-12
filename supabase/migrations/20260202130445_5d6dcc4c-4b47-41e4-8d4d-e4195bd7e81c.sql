-- =====================================================
-- CONTRIVER PLATFORM TRANSFORMATION - COMPLETE SCHEMA
-- =====================================================

-- 1. Update profiles table with new columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS headline text,
ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS experience_years integer,
ADD COLUMN IF NOT EXISTS is_mentor boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_recruiter boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS is_investor boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_talent boolean DEFAULT false;

-- 2. Connection System (replacing follows)
CREATE TABLE public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  connection_type text NOT NULL DEFAULT 'professional',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_a, user_b),
  CHECK (user_a < user_b) -- Ensure consistent ordering
);

CREATE TABLE public.connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- 3. Ideas Hub
CREATE TABLE public.ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  domain text NOT NULL,
  target_market text,
  problem_statement text,
  solution text,
  is_ai_generated boolean DEFAULT false,
  votes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.idea_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(idea_id, user_id)
);

-- 4. Mentor System
CREATE TABLE public.mentors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  expertise text[] NOT NULL DEFAULT '{}',
  bio text,
  years_experience integer,
  linkedin_url text,
  availability text DEFAULT 'available',
  rating numeric(3,2) DEFAULT 0,
  total_reviews integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.mentor_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expertise_areas text[] NOT NULL,
  years_experience integer NOT NULL,
  linkedin_url text,
  bio text NOT NULL,
  motivation text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_feedback text,
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.mentor_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  story_type text NOT NULL CHECK (story_type IN ('success', 'failure', 'insight')),
  media_url text,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Startups
CREATE TABLE public.startups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  tagline text,
  description text NOT NULL,
  logo_url text,
  industry text NOT NULL,
  stage text NOT NULL CHECK (stage IN ('idea', 'mvp', 'growth', 'scaling')),
  founded_date date,
  website_url text,
  pitch_deck_url text,
  funding_status text DEFAULT 'bootstrapped',
  amount_raised numeric(15,2) DEFAULT 0,
  seeking_investment boolean DEFAULT false,
  investment_amount_sought numeric(15,2),
  user_count integer,
  revenue numeric(15,2),
  growth_rate text,
  is_verified boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.startup_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  role text NOT NULL,
  linkedin_url text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.startup_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  investor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interest_type text NOT NULL DEFAULT 'interested' CHECK (interest_type IN ('interested', 'watching', 'contacted')),
  message text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(startup_id, investor_id)
);

-- 6. Jobs & Talents
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  company_logo_url text,
  title text NOT NULL,
  description text NOT NULL,
  requirements text,
  location text NOT NULL,
  work_type text NOT NULL CHECK (work_type IN ('remote', 'onsite', 'hybrid')),
  job_type text NOT NULL CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship')),
  salary_min numeric(12,2),
  salary_max numeric(12,2),
  salary_currency text DEFAULT 'USD',
  skills_required text[] DEFAULT '{}',
  experience_level text CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead', 'executive')),
  is_active boolean DEFAULT true,
  applications_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resume_url text,
  cover_letter text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'hired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

CREATE TABLE public.talents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  bio text,
  skills text[] NOT NULL DEFAULT '{}',
  experience_years integer,
  resume_url text,
  portfolio_url text,
  availability text DEFAULT 'available' CHECK (availability IN ('available', 'open', 'not_available')),
  preferred_work_type text[] DEFAULT '{}',
  expected_salary_min numeric(12,2),
  expected_salary_max numeric(12,2),
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. AI Features
CREATE TABLE public.ai_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_type text NOT NULL CHECK (session_type IN ('mentor', 'strategy', 'pitch', 'idea')),
  title text,
  messages jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.pitch_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  startup_id uuid REFERENCES public.startups(id) ON DELETE SET NULL,
  pitch_content text NOT NULL,
  target_audience text,
  funding_stage text,
  feedback jsonb NOT NULL,
  clarity_score integer,
  persuasiveness_score integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.strategy_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  idea_id uuid REFERENCES public.ideas(id) ON DELETE SET NULL,
  title text NOT NULL,
  idea_description text NOT NULL,
  target_market text,
  budget_constraints text,
  strategy jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. Content Moderation
CREATE TABLE public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('post', 'short', 'comment', 'story', 'job', 'startup')),
  content_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by uuid REFERENCES public.profiles(id),
  resolution text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Connections
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their connections"
ON public.connections FOR SELECT
USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "System can create connections"
ON public.connections FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete their connections"
ON public.connections FOR DELETE
USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Connection Requests
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their connection requests"
ON public.connection_requests FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Authenticated users can send requests"
ON public.connection_requests FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received requests"
ON public.connection_requests FOR UPDATE
USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their requests"
ON public.connection_requests FOR DELETE
USING (auth.uid() = sender_id);

-- Ideas
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published ideas"
ON public.ideas FOR SELECT
USING (is_published = true);

CREATE POLICY "Users can create ideas"
ON public.ideas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their ideas"
ON public.ideas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their ideas"
ON public.ideas FOR DELETE
USING (auth.uid() = user_id);

-- Idea Votes
ALTER TABLE public.idea_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view idea votes"
ON public.idea_votes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can vote"
ON public.idea_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their vote"
ON public.idea_votes FOR DELETE
USING (auth.uid() = user_id);

-- Mentors
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified mentors"
ON public.mentors FOR SELECT
USING (is_verified = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their mentor profile"
ON public.mentors FOR ALL
USING (auth.uid() = user_id);

-- Mentor Applications
ALTER TABLE public.mentor_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
ON public.mentor_applications FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create applications"
ON public.mentor_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update applications"
ON public.mentor_applications FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Mentor Stories
ALTER TABLE public.mentor_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published stories"
ON public.mentor_stories FOR SELECT
USING (is_published = true);

CREATE POLICY "Mentors can manage their stories"
ON public.mentor_stories FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.mentors 
  WHERE mentors.id = mentor_stories.mentor_id 
  AND mentors.user_id = auth.uid()
));

-- Startups
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view startups"
ON public.startups FOR SELECT
USING (true);

CREATE POLICY "Founders can manage their startups"
ON public.startups FOR ALL
USING (auth.uid() = founder_id);

-- Startup Team Members
ALTER TABLE public.startup_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view team members"
ON public.startup_team_members FOR SELECT
USING (true);

CREATE POLICY "Startup founders can manage team"
ON public.startup_team_members FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.startups 
  WHERE startups.id = startup_team_members.startup_id 
  AND startups.founder_id = auth.uid()
));

-- Startup Interests
ALTER TABLE public.startup_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founders can view interests in their startups"
ON public.startup_interests FOR SELECT
USING (
  auth.uid() = investor_id OR 
  EXISTS (
    SELECT 1 FROM public.startups 
    WHERE startups.id = startup_interests.startup_id 
    AND startups.founder_id = auth.uid()
  )
);

CREATE POLICY "Investors can manage their interests"
ON public.startup_interests FOR ALL
USING (auth.uid() = investor_id);

-- Jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active jobs"
ON public.jobs FOR SELECT
USING (is_active = true);

CREATE POLICY "Recruiters can manage their jobs"
ON public.jobs FOR ALL
USING (auth.uid() = posted_by);

-- Job Applications
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants can view own applications"
ON public.job_applications FOR SELECT
USING (
  auth.uid() = applicant_id OR 
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = job_applications.job_id 
    AND jobs.posted_by = auth.uid()
  )
);

CREATE POLICY "Applicants can create applications"
ON public.job_applications FOR INSERT
WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Recruiters can update applications"
ON public.job_applications FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.jobs 
  WHERE jobs.id = job_applications.job_id 
  AND jobs.posted_by = auth.uid()
));

-- Talents
ALTER TABLE public.talents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available talents"
ON public.talents FOR SELECT
USING (availability != 'not_available' OR auth.uid() = user_id);

CREATE POLICY "Users can manage their talent profile"
ON public.talents FOR ALL
USING (auth.uid() = user_id);

-- AI Chat Sessions
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their AI sessions"
ON public.ai_chat_sessions FOR ALL
USING (auth.uid() = user_id);

-- Pitch Feedback
ALTER TABLE public.pitch_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their pitch feedback"
ON public.pitch_feedback FOR ALL
USING (auth.uid() = user_id);

-- Strategy Plans
ALTER TABLE public.strategy_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their strategy plans"
ON public.strategy_plans FOR ALL
USING (auth.uid() = user_id);

-- Content Reports
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
ON public.content_reports FOR SELECT
USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can create reports"
ON public.content_reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage reports"
ON public.content_reports FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE COUNTS
-- =====================================================

-- Update idea votes count
CREATE OR REPLACE FUNCTION public.update_idea_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.ideas SET votes_count = votes_count + 1 WHERE id = NEW.idea_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.ideas SET votes_count = GREATEST(votes_count - 1, 0) WHERE id = OLD.idea_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_idea_votes_count_trigger
AFTER INSERT OR DELETE ON public.idea_votes
FOR EACH ROW EXECUTE FUNCTION public.update_idea_votes_count();

-- Update job applications count
CREATE OR REPLACE FUNCTION public.update_job_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.jobs SET applications_count = applications_count + 1 WHERE id = NEW.job_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.jobs SET applications_count = GREATEST(applications_count - 1, 0) WHERE id = OLD.job_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_job_applications_count_trigger
AFTER INSERT OR DELETE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.update_job_applications_count();

-- Update mentor stories likes count
CREATE OR REPLACE FUNCTION public.update_mentor_story_likes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.target_type = 'story' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.mentor_stories SET likes_count = likes_count + 1 WHERE id = NEW.target_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.mentor_stories SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.target_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_mentor_story_likes_trigger
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.update_mentor_story_likes();

-- Updated_at triggers for new tables
CREATE TRIGGER update_connection_requests_updated_at
BEFORE UPDATE ON public.connection_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at
BEFORE UPDATE ON public.ideas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentors_updated_at
BEFORE UPDATE ON public.mentors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentor_stories_updated_at
BEFORE UPDATE ON public.mentor_stories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_startups_updated_at
BEFORE UPDATE ON public.startups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_talents_updated_at
BEFORE UPDATE ON public.talents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_chat_sessions_updated_at
BEFORE UPDATE ON public.ai_chat_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_strategy_plans_updated_at
BEFORE UPDATE ON public.strategy_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('pitch-decks', 'pitch-decks', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('mentor-stories', 'mentor-stories', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('startup-logos', 'startup-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for pitch-decks
CREATE POLICY "Users can upload own pitch decks"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pitch-decks' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own pitch decks"
ON storage.objects FOR SELECT
USING (bucket_id = 'pitch-decks' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own pitch decks"
ON storage.objects FOR DELETE
USING (bucket_id = 'pitch-decks' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for resumes
CREATE POLICY "Users can upload own resumes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own resumes"
ON storage.objects FOR SELECT
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own resumes"
ON storage.objects FOR DELETE
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for mentor-stories (public)
CREATE POLICY "Anyone can view mentor story media"
ON storage.objects FOR SELECT
USING (bucket_id = 'mentor-stories');

CREATE POLICY "Mentors can upload story media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'mentor-stories' AND auth.uid() IS NOT NULL);

CREATE POLICY "Mentors can delete own story media"
ON storage.objects FOR DELETE
USING (bucket_id = 'mentor-stories' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for startup-logos (public)
CREATE POLICY "Anyone can view startup logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'startup-logos');

CREATE POLICY "Founders can upload startup logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'startup-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Founders can delete startup logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'startup-logos' AND auth.uid()::text = (storage.foldername(name))[1]);