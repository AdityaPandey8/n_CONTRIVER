-- =====================================================
-- CONTRIVER Platform Enhancement - New Tables
-- =====================================================

-- 1. Hackathons table for user-created hackathon events
CREATE TABLE public.hackathons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  organizer TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  prize TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  registration_deadline TIMESTAMPTZ,
  location TEXT,
  max_participants INTEGER,
  tags TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.profiles(id),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on hackathons
ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hackathons
CREATE POLICY "Anyone can view verified or own hackathons"
  ON public.hackathons FOR SELECT
  USING (is_verified = true OR auth.uid() = creator_id);

CREATE POLICY "Authenticated users can create hackathons"
  ON public.hackathons FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their hackathons"
  ON public.hackathons FOR UPDATE
  USING (auth.uid() = creator_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Creators can delete their hackathons"
  ON public.hackathons FOR DELETE
  USING (auth.uid() = creator_id OR has_role(auth.uid(), 'admin'));

-- 2. Hackathon registrations table
CREATE TABLE public.hackathon_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  team_name TEXT,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'withdrawn', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hackathon_id, user_id)
);

-- Enable RLS on hackathon_registrations
ALTER TABLE public.hackathon_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hackathon_registrations
CREATE POLICY "Users can view their own registrations"
  ON public.hackathon_registrations FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.hackathons WHERE id = hackathon_id AND creator_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can register for hackathons"
  ON public.hackathon_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their registrations"
  ON public.hackathon_registrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their registrations"
  ON public.hackathon_registrations FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Saved posts table for bookmarks
CREATE TABLE public.saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'short')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

-- Enable RLS on saved_posts
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_posts
CREATE POLICY "Users can view their own saved posts"
  ON public.saved_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can save posts"
  ON public.saved_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave their posts"
  ON public.saved_posts FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Reposts table
CREATE TABLE public.reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  original_post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  original_short_id UUID REFERENCES public.shorts(id) ON DELETE CASCADE,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (original_post_id IS NOT NULL OR original_short_id IS NOT NULL)
);

-- Enable RLS on reposts
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reposts
CREATE POLICY "Anyone can view reposts"
  ON public.reposts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reposts"
  ON public.reposts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their reposts"
  ON public.reposts FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Add update triggers
CREATE TRIGGER update_hackathons_updated_at
  BEFORE UPDATE ON public.hackathons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();