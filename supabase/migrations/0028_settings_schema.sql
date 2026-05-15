-- =============================================================
-- 0028_settings_schema.sql
-- Adds user preferences and global agency settings
-- =============================================================

-- 1. Expand profiles with personal preferences
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- 2. Create agency_settings table (Global/Admin only)
CREATE TABLE IF NOT EXISTS public.agency_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_name TEXT NOT NULL DEFAULT 'Aura Agency',
  accent_color TEXT DEFAULT '#00e1ff',
  default_currency TEXT DEFAULT 'USD',
  invoice_terms TEXT,
  portal_welcome_message TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read agency settings (needed for UI themes)
CREATE POLICY "Anyone can view agency settings"
  ON public.agency_settings FOR SELECT
  USING (true);

-- Policy: Only admins can update agency settings
CREATE POLICY "Only admins can update agency settings"
  ON public.agency_settings FOR UPDATE
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

-- Policy: Only admins can insert agency settings
CREATE POLICY "Only admins can insert agency settings"
  ON public.agency_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Insert a default row if the table is empty
INSERT INTO public.agency_settings (agency_name)
SELECT 'Aura Agency'
WHERE NOT EXISTS (SELECT 1 FROM public.agency_settings);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.agency_settings;
