
-- Pitch Decks table
CREATE TABLE public.pitch_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.idea_workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled Pitch Deck',
  slides jsonb NOT NULL DEFAULT '[]'::jsonb,
  style text NOT NULL DEFAULT 'minimal',
  mode text NOT NULL DEFAULT 'normal',
  speaker_notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.pitch_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pitch decks" ON public.pitch_decks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Pitch Deck Sources table
CREATE TABLE public.pitch_deck_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_deck_id uuid REFERENCES public.pitch_decks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  extracted_text text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.pitch_deck_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pitch deck sources" ON public.pitch_deck_sources FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Investors table
CREATE TABLE public.investors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  firm text,
  bio text,
  focus_domains text[] DEFAULT '{}'::text[],
  stage_preference text[] DEFAULT '{}'::text[],
  ticket_size_min numeric,
  ticket_size_max numeric,
  location text,
  avatar_url text,
  past_investments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view investors" ON public.investors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own investor profile" ON public.investors FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Investor Matches table
CREATE TABLE public.investor_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  investor_id uuid REFERENCES public.investors(id) ON DELETE CASCADE NOT NULL,
  workspace_id uuid REFERENCES public.idea_workspaces(id) ON DELETE CASCADE NOT NULL,
  match_score integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.investor_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own matches" ON public.investor_matches FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Pitch Shares table
CREATE TABLE public.pitch_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  investor_id uuid REFERENCES public.investors(id) ON DELETE CASCADE NOT NULL,
  pitch_deck_id uuid REFERENCES public.pitch_decks(id) ON DELETE SET NULL,
  workspace_id uuid REFERENCES public.idea_workspaces(id) ON DELETE CASCADE NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.pitch_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pitch shares" ON public.pitch_shares FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Learning Tracks table
CREATE TABLE public.learning_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  level text NOT NULL DEFAULT 'beginner',
  description text,
  lessons jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.learning_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view learning tracks" ON public.learning_tracks FOR SELECT TO authenticated USING (true);

-- User Progress table
CREATE TABLE public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  track_id uuid REFERENCES public.learning_tracks(id) ON DELETE CASCADE,
  completed_lessons jsonb NOT NULL DEFAULT '[]'::jsonb,
  points integer NOT NULL DEFAULT 0,
  streak_days integer NOT NULL DEFAULT 0,
  last_active timestamptz DEFAULT now(),
  badges jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, track_id)
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress" ON public.user_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Seed sample investors
INSERT INTO public.investors (name, firm, bio, focus_domains, stage_preference, ticket_size_min, ticket_size_max, location, past_investments) VALUES
('Priya Sharma', 'Nexus Venture Partners', 'Early-stage investor focused on consumer tech and SaaS in India.', ARRAY['SaaS', 'Consumer Tech', 'FinTech'], ARRAY['idea', 'validation', 'mvp'], 50000, 500000, 'Mumbai, India', '[{"name": "Unacademy", "amount": "$1M"}, {"name": "Rapido", "amount": "$500K"}]'),
('Rajesh Gupta', 'Sequoia Capital India', 'Growth-stage investor with a keen eye for EdTech and HealthTech.', ARRAY['EdTech', 'HealthTech', 'AI/ML'], ARRAY['mvp', 'pitch', 'launch'], 200000, 5000000, 'Bangalore, India', '[{"name": "BYJU''s", "amount": "$5M"}, {"name": "Practo", "amount": "$2M"}]'),
('Anita Desai', 'Blume Ventures', 'Seed-stage investor passionate about deep tech and sustainability.', ARRAY['DeepTech', 'Sustainability', 'CleanTech'], ARRAY['idea', 'validation'], 25000, 250000, 'Delhi, India', '[{"name": "GreyOrange", "amount": "$200K"}, {"name": "Dunzo", "amount": "$150K"}]'),
('Michael Chen', 'Accel Partners', 'Series A specialist in B2B SaaS and enterprise solutions.', ARRAY['B2B SaaS', 'Enterprise', 'DevTools'], ARRAY['mvp', 'pitch'], 500000, 3000000, 'San Francisco, USA', '[{"name": "Freshworks", "amount": "$3M"}, {"name": "BrowserStack", "amount": "$2M"}]'),
('Sarah Thompson', '500 Global', 'Micro-VC investing in diverse founders across emerging markets.', ARRAY['FinTech', 'E-Commerce', 'Social Impact'], ARRAY['idea', 'validation', 'mvp'], 25000, 150000, 'Singapore', '[{"name": "Grab", "amount": "$100K"}, {"name": "Carousell", "amount": "$75K"}]'),
('Vikram Patel', 'Matrix Partners India', 'Focus on consumer internet and marketplace businesses.', ARRAY['Marketplace', 'Consumer Internet', 'D2C'], ARRAY['validation', 'mvp', 'pitch'], 100000, 2000000, 'Mumbai, India', '[{"name": "Ola", "amount": "$2M"}, {"name": "Quikr", "amount": "$1.5M"}]'),
('Lisa Wang', 'Y Combinator', 'Accelerator partner backing ambitious technical founders globally.', ARRAY['AI/ML', 'SaaS', 'DevTools', 'FinTech'], ARRAY['idea', 'validation'], 125000, 500000, 'San Francisco, USA', '[{"name": "Razorpay", "amount": "$125K"}, {"name": "Zerodha", "amount": "$125K"}]'),
('Arjun Nair', 'Kalaari Capital', 'Early-stage VC investing in technology-led businesses in India.', ARRAY['HealthTech', 'EdTech', 'AgriTech'], ARRAY['idea', 'validation', 'mvp'], 50000, 1000000, 'Bangalore, India', '[{"name": "Cure.fit", "amount": "$500K"}, {"name": "Dream11", "amount": "$300K"}]'),
('Emma Rodriguez', 'Techstars', 'Accelerator MD with a passion for social enterprise and impact investing.', ARRAY['Social Impact', 'CleanTech', 'HealthTech'], ARRAY['idea', 'validation'], 20000, 120000, 'London, UK', '[{"name": "Impossible Foods", "amount": "$100K"}, {"name": "Too Good To Go", "amount": "$80K"}]'),
('Deepak Joshi', 'Tiger Global', 'Late-stage investor focused on high-growth internet companies.', ARRAY['E-Commerce', 'FinTech', 'EdTech', 'SaaS'], ARRAY['pitch', 'launch'], 1000000, 10000000, 'New York, USA', '[{"name": "Flipkart", "amount": "$10M"}, {"name": "Ola", "amount": "$5M"}]');

-- Seed learning tracks
INSERT INTO public.learning_tracks (title, level, description, lessons) VALUES
('Startup Foundations', 'beginner', 'Learn the basics of building a startup from idea to validation.', '[
  {"id": "b1", "title": "Finding Your Problem", "description": "Learn to identify real problems worth solving.", "workspace_tab": "details", "points": 10},
  {"id": "b2", "title": "Defining Your Solution", "description": "Craft a compelling solution statement.", "workspace_tab": "details", "points": 10},
  {"id": "b3", "title": "Target Audience", "description": "Identify and understand your ideal customer.", "workspace_tab": "details", "points": 15},
  {"id": "b4", "title": "Market Research", "description": "Validate market size and opportunity.", "workspace_tab": "validation", "points": 20},
  {"id": "b5", "title": "Your First Pitch", "description": "Create a simple elevator pitch.", "workspace_tab": "pitch", "points": 25}
]'),
('Growth & Strategy', 'intermediate', 'Develop go-to-market strategies and business models.', '[
  {"id": "i1", "title": "Business Model Canvas", "description": "Map out your complete business model.", "workspace_tab": "strategy", "points": 20},
  {"id": "i2", "title": "Competitive Analysis", "description": "Analyze competitors and find your edge.", "workspace_tab": "details", "points": 20},
  {"id": "i3", "title": "Go-to-Market Plan", "description": "Plan your launch strategy.", "workspace_tab": "strategy", "points": 25},
  {"id": "i4", "title": "Financial Projections", "description": "Create basic financial forecasts.", "workspace_tab": "strategy", "points": 25},
  {"id": "i5", "title": "Investor-Ready Pitch", "description": "Build a pitch deck that converts.", "workspace_tab": "pitch", "points": 30}
]'),
('Fundraising Mastery', 'advanced', 'Master the art of raising investment for your startup.', '[
  {"id": "a1", "title": "Investor Landscape", "description": "Understand different types of investors and what they look for.", "workspace_tab": "overview", "points": 25},
  {"id": "a2", "title": "Valuation Basics", "description": "Learn how startups are valued at different stages.", "workspace_tab": "strategy", "points": 30},
  {"id": "a3", "title": "Due Diligence Prep", "description": "Prepare your startup for investor scrutiny.", "workspace_tab": "documents", "points": 30},
  {"id": "a4", "title": "Term Sheet Negotiation", "description": "Navigate term sheets and investment terms.", "workspace_tab": "documents", "points": 35},
  {"id": "a5", "title": "Closing the Round", "description": "From verbal commitment to signed deal.", "workspace_tab": "documents", "points": 40}
]');
