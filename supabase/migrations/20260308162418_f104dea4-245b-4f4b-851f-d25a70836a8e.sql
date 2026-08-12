-- Admin policies for jobs
CREATE POLICY "Admins can view all jobs" ON public.jobs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update jobs" ON public.jobs FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete jobs" ON public.jobs FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for talents
CREATE POLICY "Admins can view all talents" ON public.talents FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update talents" ON public.talents FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete talents" ON public.talents FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));