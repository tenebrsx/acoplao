-- Create campaign blueprints table
CREATE TABLE IF NOT EXISTS public.campaign_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create blueprint deliverables table
CREATE TABLE IF NOT EXISTS public.blueprint_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES public.campaign_blueprints(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other', -- 'video', 'image', 'other'
  phases JSONB NOT NULL DEFAULT '[]', -- Array of strings: ["Discovery", "Review", "Final"]
  sort_order INT DEFAULT 0
);

-- RLS
ALTER TABLE public.campaign_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprint_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view blueprints"
  ON public.campaign_blueprints FOR SELECT
  USING (true);

CREATE POLICY "Everyone can view blueprint deliverables"
  ON public.blueprint_deliverables FOR SELECT
  USING (true);

-- Insert default blueprints
INSERT INTO public.campaign_blueprints (name, description) VALUES
('Video Production', 'Multi-stage video creation workflow.'),
('Brand Identity', 'Comprehensive branding and asset design.'),
('SEO Content Audit', 'Deep dive into SEO performance and optimization.');

-- Video Production deliverables
INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Campaign Trailer', 'video', '["Scripting", "Filming", "Post-Prod", "Review"]'::jsonb, 1 FROM public.campaign_blueprints WHERE name = 'Video Production';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Social Media Reel 1', 'video', '["Draft", "Review", "Published"]'::jsonb, 2 FROM public.campaign_blueprints WHERE name = 'Video Production';

-- Brand Identity deliverables
INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Logo Concepts', 'image', '["Moodboard", "Concepts", "Refinement", "Final"]'::jsonb, 1 FROM public.campaign_blueprints WHERE name = 'Brand Identity';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Typography & Color', 'image', '["Proposal", "Guidelines"]'::jsonb, 2 FROM public.campaign_blueprints WHERE name = 'Brand Identity';
