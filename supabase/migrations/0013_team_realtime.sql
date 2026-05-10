-- Add profiles to realtime so the Team Management tab updates instantly when a user joins or changes role
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
