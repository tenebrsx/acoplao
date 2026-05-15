-- =============================================================
-- 0037_campaign_control_tower.sql
-- Supports advanced campaign management features:
-- Activity feeds, visual moodboards, and client broadcasts.
-- =============================================================

-- 1. BOTTLENECK ENUM
DO $$ BEGIN
  CREATE TYPE public.bottleneck_status AS ENUM ('on_track', 'waiting_client', 'waiting_team', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. UPDATE PROJECTS TABLE
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS client_broadcast_message TEXT,
  ADD COLUMN IF NOT EXISTS bottleneck_status public.bottleneck_status DEFAULT 'on_track',
  ADD COLUMN IF NOT EXISTS strategy_data JSONB DEFAULT '{}'::jsonb;

-- 3. CAMPAIGN ACTIVITY TABLE
CREATE TABLE IF NOT EXISTS public.campaign_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'status_change', 'asset_created', 'phase_completed', 'broadcast_sent'
  target_name TEXT,     -- e.g. Name of the asset or phase
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.campaign_activity ENABLE ROW LEVEL SECURITY;

-- 4. CAMPAIGN MEDIA (MOODBOARD / MEDIA POOL)
CREATE TABLE IF NOT EXISTS public.campaign_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL, -- 'link', 'image', 'audio', 'video'
  url TEXT NOT NULL,
  title TEXT,
  thumbnail_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.campaign_media ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES

-- CAMPAIGN ACTIVITY
CREATE POLICY "Members can view campaign activity"
  ON public.campaign_activity FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = campaign_activity.project_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can insert activity"
  ON public.campaign_activity FOR INSERT
  WITH CHECK (true);

-- CAMPAIGN MEDIA
CREATE POLICY "Members can view campaign media"
  ON public.campaign_media FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = campaign_media.project_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins and Managers can manage media"
  ON public.campaign_media FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true)
  );

CREATE POLICY "Members can insert media"
  ON public.campaign_media FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = campaign_media.project_id AND user_id = auth.uid())
  );
