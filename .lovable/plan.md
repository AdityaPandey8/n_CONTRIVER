# HackRadar Ingestion Overhaul

## Goals
1. Get all 5 sources (Devpost, Unstop, Devfolio, HackerEarth, Reskilll) importing reliably.
2. Fully populate the normalized `hackathons` schema so filters/sort work without touching `description`.
3. Add AI classification for missing/ambiguous fields.
4. Improve admin observability: per-source status + per-record error logging.
5. Wire Discover / Latest / Closing Soon / Recommended / Trending / Saved off the normalized dataset.

## 1. Source adapters (`supabase/functions/hackradar-ingest/index.ts`)

Rewrite each adapter to return a fully populated `NormalizedListing`. Strategy per source:

- **Devpost** — keep JSON API (`/api/hackathons`). Extend parsing:
  - registration_url = `h.url`, external_url = `h.url`
  - themes from `themes[].name`; tags = themes ∪ derived keywords
  - mode: `online` / `in-person` → `offline` / else `hybrid`
  - prize: parse `prize_amount` HTML → text + INR (USD→INR ×84)
  - deadline: `submission_period_dates` end; fallback to `open_state` heuristics
  - eligibility flags: parse `eligibility_requirement_invite_only_description`, `open_to` array

- **Devfolio** — switch to their public Algolia/JSON endpoint (`https://api.devfolio.co/api/search/hackathons`) which returns structured JSON (title, hackathon_setting, starts_at, ends_at, apply_close, prizes, tracks, city, country, team_size). Fallback to Firecrawl JSON extraction if API blocked.

- **Unstop** — use `https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons` (returns structured JSON: prize, deadline, mode, tags, region, team_min/max, eligibility). No auth needed.

- **HackerEarth** — Firecrawl JSON extraction against `https://www.hackerearth.com/challenges/hackathon/` with strict schema. Follow-up per-detail scrape only if list lacks dates.

- **Reskilll** — Firecrawl JSON extraction against `https://reskilll.com/allhacks`. Include per-card `href` as registration_url.

Add a shared `enrichListing()` step that:
- Normalizes mode to `online|offline|hybrid`
- Parses prize to INR via multi-currency regex (₹, INR, Rs, $, €, £)
- Derives `status` from dates
- Derives `is_beginner_friendly`, `is_student_only`, `allows_solo`, `difficulty` from title/description/tags keyword rules
- Fills `team_size_min/max` defaults (1/4) when unknown
- Builds `searchable_text` (title + organizer + themes + tags + city) for full-text search column

## 2. AI classification pass

After adapter output, batch listings with missing `themes`, `difficulty`, or eligibility flags through **Lovable AI Gateway** (`google/gemini-2.5-flash`) with a structured JSON schema. Cache by `dedupe_hash` in `ai_cache` to avoid re-calling. Rate-limited (max 20 per run, skip when already classified).

## 3. Schema additions (migration)

Add columns/indexes to support filters and search:
- `hackathons.registration_url` (already exists — enforce NOT NULL fallback to external_url in ingest)
- `hackathons.website_url TEXT` (official site separate from registration)
- `hackathons.difficulty TEXT` (beginner|intermediate|advanced)
- `hackathons.eligibility TEXT[]` (students, professionals, all)
- `hackathons.searchable_text TEXT` + `tsvector` generated column + GIN index
- `hackathons.ai_classified_at TIMESTAMPTZ`
- Indexes on `(status, registration_deadline)`, `(mode)`, `themes GIN`, `tags GIN`, `city`
- `hackathon_ingestion_runs`: add `records_seen INT`, `duration_ms INT`, `error_details JSONB` (array of `{external_id, error}`)

Keep existing `UNIQUE (source_slug, external_id)` constraint.

## 4. Admin dashboard (`src/pages/admin/HackRadarIngestion.tsx`)

Extend existing page:
- Per-source card: last run status, success rate (7d), records ingested, last error
- Runs table: expandable row showing `error_details` JSON
- Failed-records tab: filter by source, show raw url + error
- Manual "Run source" and "Run all" buttons already exist; add "Re-classify with AI" button

## 5. Frontend query updates

Update `src/hooks/useHackRadar.ts` + `src/pages/dashboard/Hackathons.tsx`:
- Discover: default trending sort
- Latest: `order first_seen_at desc`
- Closing Soon: `registration_deadline within 7d`
- Recommended: match `hackradar_preferences.themes` overlap with `hackathons.themes`
- Trending: `popularity_score desc, saves_count desc`
- Saved: join `hackathon_saves`
- Search bar queries `searchable_text` via `ilike` (or `textSearch` on tsvector)
- Filter chips read from normalized columns (themes/mode/city/difficulty/eligibility/team_size)

## 6. Verification

After deploy:
1. Trigger `hackradar-ingest` for all sources
2. Check `hackathon_ingestion_runs`: each source should have `status='success'` with `inserted_count > 0`
3. Spot-check 3 hackathons per source in DB to confirm registration_url, themes, mode, prize, deadline populated
4. Load `/dashboard/hackathons` and verify each tab (Discover, Latest, Closing Soon, Recommended, Trending, Saved) renders real rows and filters narrow results

## Technical notes

- Firecrawl calls only fire if `FIRECRAWL_API_KEY` present; adapters return `[]` + log a warning when missing so Devpost/Unstop/Devfolio still succeed.
- AI classification uses existing `LOVABLE_API_KEY` — no new secret required.
- All schema changes go through a single migration with GRANTs preserved.
- Cron already scheduled at 06:00 UTC — no change.

## Open question
Should Reskilll and HackerEarth require Firecrawl (which needs the `FIRECRAWL_API_KEY` secret to be set), or should I add lightweight HTML scraping fallbacks using regex? Firecrawl is far more reliable but costs credits.
