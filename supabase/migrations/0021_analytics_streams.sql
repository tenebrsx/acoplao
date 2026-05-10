-- =============================================================
-- 0021_analytics_streams.sql
-- Analytics integration for the Client Portal Insights Engine
-- =============================================================

CREATE TABLE IF NOT EXISTS public.analytics_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'ga4')),
  account_name TEXT NOT NULL,
  access_token TEXT, -- In a real app, this should be encrypted or stored securely
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, platform)
);

-- Table to store cached/historical metrics to prevent hammering the external APIs
CREATE TABLE IF NOT EXISTS public.analytics_metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES public.analytics_streams(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  total_views BIGINT NOT NULL DEFAULT 0,
  total_engagement BIGINT NOT NULL DEFAULT 0,
  follower_growth INT NOT NULL DEFAULT 0,
  top_performing_asset_id UUID REFERENCES public.digital_assets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(stream_id, metric_date)
);

ALTER TABLE public.analytics_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_metrics_cache ENABLE ROW LEVEL SECURITY;

-- Admins can manage streams
CREATE POLICY "Admins can manage analytics streams"
  ON public.analytics_streams FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true));

-- Admins can manage metrics
CREATE POLICY "Admins can manage analytics metrics"
  ON public.analytics_metrics_cache FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true));

-- Updated at triggers
CREATE TRIGGER update_analytics_streams_updated_at
  BEFORE UPDATE ON public.analytics_streams
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
