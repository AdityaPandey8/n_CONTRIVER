
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'match_scores_user_target_unique'
  ) THEN
    ALTER TABLE public.match_scores
      ADD CONSTRAINT match_scores_user_target_unique UNIQUE (user_id, target_id, target_type);
  END IF;
END $$;
