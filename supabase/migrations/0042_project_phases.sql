-- =============================================================
-- 0042_project_phases.sql
-- Transforms campaign blueprints into project-type templates
-- and introduces project-level phases for workflow management.
-- Deliverables become final outputs, not workflow containers.
-- =============================================================

-- 1. ADD CATEGORY TO BLUEPRINTS
ALTER TABLE public.campaign_blueprints ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';
ALTER TABLE public.campaign_blueprints ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'folder';

-- Update existing blueprints with categories
UPDATE public.campaign_blueprints SET category = 'video', icon = 'video' WHERE name = 'Video Production';
UPDATE public.campaign_blueprints SET category = 'branding', icon = 'palette' WHERE name = 'Brand Identity';
UPDATE public.campaign_blueprints SET category = 'marketing', icon = 'search' WHERE name = 'SEO Content Audit';

-- 2. ADD PROJECT TYPE TO PROJECTS
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'other';

-- 3. CREATE PROJECT PHASES TABLE (workflow phases at project level)
CREATE TABLE IF NOT EXISTS public.project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;

-- 4. RLS FOR PROJECT PHASES
CREATE POLICY "Admins can manage all project phases"
  ON public.project_phases FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
  );

CREATE POLICY "Members can view project phases"
  ON public.project_phases FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = project_phases.project_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can update project phases"
  ON public.project_phases FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = project_phases.project_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can insert project phases"
  ON public.project_phases FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = project_id AND user_id = auth.uid())
  );

-- 5. ADD TRIGGER FOR UPDATED_AT
CREATE TRIGGER update_project_phases_updated_at
  BEFORE UPDATE ON public.project_phases
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- 6. REALTIME FOR PROJECT PHASES
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_phases;

-- 7. SEED NEW DIVERSE PROJECT TEMPLATES
INSERT INTO public.campaign_blueprints (name, description, category, icon) VALUES
('Website Build', 'Full website design and development workflow.', 'web', 'globe'),
('Commercial Video', 'High-end commercial production from concept to delivery.', 'video', 'clapperboard'),
('Brand Identity', 'Complete brand system including logo, typography, and guidelines.', 'branding', 'palette'),
('Music Production', 'Original music composition, recording, and mastering.', 'audio', 'music'),
('Copywriting Campaign', 'Strategic copy for ads, web, and marketing materials.', 'copywriting', 'pen-tool'),
('Social Media Package', 'Multi-platform content creation and scheduling.', 'social_media', 'instagram'),
('Logo Design', 'Focused logo exploration and refinement.', 'branding', 'hexagon'),
('Product Photography', 'Professional product shot planning and execution.', 'photography', 'camera')
ON CONFLICT DO NOTHING;

-- 8. SEED PHASES FOR EACH TEMPLATE (stored in blueprint_deliverables, repurposed as phase templates)
-- Website Build phases
INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Discovery & Planning', 'milestone', '["Stakeholder Interviews", "Requirements Doc", "Sitemap & Wireframes", "Tech Stack Decision"]'::jsonb, 1
FROM public.campaign_blueprints WHERE name = 'Website Build';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Design', 'milestone', '["Moodboard", "Visual Design", "Design Review", "Design Approval"]'::jsonb, 2
FROM public.campaign_blueprints WHERE name = 'Website Build';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Development', 'milestone', '["Frontend Build", "CMS Integration", "Backend/API", "QA Testing"]'::jsonb, 3
FROM public.campaign_blueprints WHERE name = 'Website Build';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Launch', 'milestone', '["Content Migration", "SEO Setup", "Analytics", "Go Live"]'::jsonb, 4
FROM public.campaign_blueprints WHERE name = 'Website Build';

-- Commercial Video phases
INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Pre-Production', 'milestone', '["Creative Brief", "Scriptwriting", "Storyboard", "Casting & Locations"]'::jsonb, 1
FROM public.campaign_blueprints WHERE name = 'Commercial Video';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Production', 'milestone', '["Filming", "Audio Recording", "B-Roll", "Directing"]'::jsonb, 2
FROM public.campaign_blueprints WHERE name = 'Commercial Video';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Post-Production', 'milestone', '["Editing", "Color Grading", "Sound Design", "VFX/Motion"]'::jsonb, 3
FROM public.campaign_blueprints WHERE name = 'Commercial Video';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Delivery', 'milestone', '["Client Review", "Revisions", "Final Export", "Asset Handoff"]'::jsonb, 4
FROM public.campaign_blueprints WHERE name = 'Commercial Video';

-- Brand Identity phases
INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Discovery', 'milestone', '["Brand Audit", "Competitor Analysis", "Target Audience", "Brand Strategy"]'::jsonb, 1
FROM public.campaign_blueprints WHERE name = 'Brand Identity';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Design Exploration', 'milestone', '["Moodboard", "Logo Concepts (3)", "Color Exploration", "Typography Studies"]'::jsonb, 2
FROM public.campaign_blueprints WHERE name = 'Brand Identity';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Refinement', 'milestone', '["Logo Refinement", "Brand Mockups", "Guidelines Draft", "Client Presentation"]'::jsonb, 3
FROM public.campaign_blueprints WHERE name = 'Brand Identity';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Delivery', 'milestone', '["Final Assets", "Brand Guidelines", "File Package", "Brand Launch Support"]'::jsonb, 4
FROM public.campaign_blueprints WHERE name = 'Brand Identity';

-- Music Production phases
INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Composition', 'milestone', '["Brief & References", "Demo/Sketch", "Arrangement", "Approval"]'::jsonb, 1
FROM public.campaign_blueprints WHERE name = 'Music Production';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Recording', 'milestone', '["Tracking", "Overdubs", "Vocals/Instruments", "Comping"]'::jsonb, 2
FROM public.campaign_blueprints WHERE name = 'Music Production';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Mixing & Mastering', 'milestone', '["Mixing", "Client Review", "Revisions", "Mastering"]'::jsonb, 3
FROM public.campaign_blueprints WHERE name = 'Music Production';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Delivery', 'milestone', '["Final Files", "Stem Delivery", "Metadata & ISRC", "Archive"]'::jsonb, 4
FROM public.campaign_blueprints WHERE name = 'Music Production';

-- Copywriting Campaign phases
INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Strategy', 'milestone', '["Creative Brief", "Tone of Voice", "Messaging Framework", "Channel Strategy"]'::jsonb, 1
FROM public.campaign_blueprints WHERE name = 'Copywriting Campaign';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Drafting', 'milestone', '["Headlines & Hooks", "Body Copy", "CTAs", "SEO Optimization"]'::jsonb, 2
FROM public.campaign_blueprints WHERE name = 'Copywriting Campaign';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Review & Polish', 'milestone', '["Client Review", "Revisions", "Proofreading", "Final Approval"]'::jsonb, 3
FROM public.campaign_blueprints WHERE name = 'Copywriting Campaign';

-- Social Media Package phases
INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Strategy', 'milestone', '["Content Calendar", "Platform Strategy", "Visual Direction", "Hashtag Research"]'::jsonb, 1
FROM public.campaign_blueprints WHERE name = 'Social Media Package';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Content Creation', 'milestone', '["Copywriting", "Visual Design", "Video Editing", "Carousel Builds"]'::jsonb, 2
FROM public.campaign_blueprints WHERE name = 'Social Media Package';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Scheduling & Launch', 'milestone', '["Client Approval", "Scheduling", "Publishing", "Community Management"]'::jsonb, 3
FROM public.campaign_blueprints WHERE name = 'Social Media Package';

-- Logo Design phases
INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Discovery', 'milestone', '["Client Brief", "Research", "Moodboard", "Direction Approval"]'::jsonb, 1
FROM public.campaign_blueprints WHERE name = 'Logo Design';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Concepts', 'milestone', '["Sketching", "Digital Concepts (3)", "Color Variations", "Presentation"]'::jsonb, 2
FROM public.campaign_blueprints WHERE name = 'Logo Design';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Refinement', 'milestone', '["Selected Concept", "Refinements", "Mockups", "Final Approval"]'::jsonb, 3
FROM public.campaign_blueprints WHERE name = 'Logo Design';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Delivery', 'milestone', '["File Package", "Usage Guidelines", "Variations", "Archive"]'::jsonb, 4
FROM public.campaign_blueprints WHERE name = 'Logo Design';

-- Product Photography phases
INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Planning', 'milestone', '["Shot List", "Lighting Plan", "Prop Styling", "Schedule"]'::jsonb, 1
FROM public.campaign_blueprints WHERE name = 'Product Photography';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Shoot', 'milestone', '["Setup", "Shooting", "Lighting Adjustments", "Backup"]'::jsonb, 2
FROM public.campaign_blueprints WHERE name = 'Product Photography';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Post-Production', 'milestone', '["Selection", "Retouching", "Color Correction", "Client Review"]'::jsonb, 3
FROM public.campaign_blueprints WHERE name = 'Product Photography';

INSERT INTO public.blueprint_deliverables (blueprint_id, title, type, phases, sort_order)
SELECT id, 'Delivery', 'milestone', '["Final Selection", "High-Res Export", "Web Optimized", "Archive"]'::jsonb, 4
FROM public.campaign_blueprints WHERE name = 'Product Photography';

-- 9. ADD PROJECT TYPE TO EXISTING PROJECTS (best effort mapping from blueprint used)
-- This is a one-time migration; won't be perfect but gets things started
UPDATE public.projects SET project_type = 'other' WHERE project_type IS NULL;