-- Admin can update any posts (for unpublish)
CREATE POLICY "Admins can update posts" ON public.posts FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
-- Admin can delete any posts
CREATE POLICY "Admins can delete posts" ON public.posts FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can update any ideas
CREATE POLICY "Admins can update ideas" ON public.ideas FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
-- Admin can delete any ideas
CREATE POLICY "Admins can delete ideas" ON public.ideas FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can update any shorts
CREATE POLICY "Admins can update shorts" ON public.shorts FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
-- Admin can delete any shorts
CREATE POLICY "Admins can delete shorts" ON public.shorts FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can delete any startups
CREATE POLICY "Admins can delete startups" ON public.startups FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));