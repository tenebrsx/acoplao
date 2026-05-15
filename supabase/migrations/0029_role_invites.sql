-- =============================================================
-- 0029_role_invites.sql
-- Allows generating specific invite links that grant specific roles
-- =============================================================

CREATE TABLE IF NOT EXISTS public.role_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.user_role NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.role_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can manage role invites
CREATE POLICY "Admins can manage role invites"
  ON public.role_invites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Policy: Anyone can read an active invite (needed for signup page to verify token)
CREATE POLICY "Anyone can read active role invites"
  ON public.role_invites FOR SELECT
  USING (is_active = true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.role_invites;
