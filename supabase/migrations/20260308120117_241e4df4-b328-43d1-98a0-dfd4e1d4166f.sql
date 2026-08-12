-- Allow admins to see ALL hackathons (including unverified ones from other users)
CREATE POLICY "Admins can view all hackathons"
ON public.hackathons FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to see all hackathon registrations (for registration counts)
CREATE POLICY "Admins can view all registrations"
ON public.hackathon_registrations FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));