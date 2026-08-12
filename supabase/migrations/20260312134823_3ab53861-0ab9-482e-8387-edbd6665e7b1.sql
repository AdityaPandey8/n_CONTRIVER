-- Allow 'idea' as a valid target_type for likes and saved_posts
ALTER TABLE public.likes DROP CONSTRAINT likes_target_type_check;
ALTER TABLE public.likes ADD CONSTRAINT likes_target_type_check 
  CHECK (target_type = ANY (ARRAY['post'::text, 'short'::text, 'comment'::text, 'idea'::text]));

ALTER TABLE public.saved_posts DROP CONSTRAINT saved_posts_target_type_check;
ALTER TABLE public.saved_posts ADD CONSTRAINT saved_posts_target_type_check 
  CHECK (target_type = ANY (ARRAY['post'::text, 'short'::text, 'idea'::text]));