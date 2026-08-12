-- Allow admins to see ALL posts (including unpublished)
CREATE POLICY "Admins can view all posts"
ON public.posts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to see ALL ideas (including unpublished)
CREATE POLICY "Admins can view all ideas"
ON public.ideas FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to see ALL shorts (including unpublished)
CREATE POLICY "Admins can view all shorts"
ON public.shorts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));