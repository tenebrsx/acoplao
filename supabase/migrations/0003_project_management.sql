-- =============================================================
-- 0003_project_management.sql
-- Full project management system: businesses, scoped projects,
-- deliverables with calendar phases, and public review links.
-- 
-- Safe to run whether or not 0002 was applied.
-- =============================================================

-- -----------------------------------------------
-- 1. NEW ENUMS
-- -----------------------------------------------

-- Deliverable status (reworked from 0002 if it exists)
DO $$ BEGIN
  CREATE TYPE public.deliverable_status_v2 AS ENUM ('in_progress', 'delivered', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Review decision enum
DO $$ BEGIN
  CREATE TYPE public.review_decision AS ENUM ('approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------
-- 2. BUSINESSES TABLE
-- -----------------------------------------------

CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------
-- 3. REWORK PROJECTS TABLE
-- -----------------------------------------------

-- Add business_id column if it doesn't exist
DO $$ BEGIN
  ALTER TABLE public.projects ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add created_by column if it doesn't exist
DO $$ BEGIN
  ALTER TABLE public.projects ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add 'paused' to project_status if it doesn't exist
DO $$ BEGIN
  ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'paused';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- We keep client_id and manager_id for backward compat but they are now optional/unused.
-- The new access control is through project_members.

-- -----------------------------------------------
-- 4. PROJECT MEMBERS (scoped access junction table)
-- -----------------------------------------------

CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------
-- 5. REWORK DELIVERABLES TABLE
-- -----------------------------------------------

-- Add new columns to existing deliverables table
DO $$ BEGIN
  ALTER TABLE public.deliverables ADD COLUMN title TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.deliverables ADD COLUMN description TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.deliverables ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Make file_url nullable (it's filled on delivery, not creation)
ALTER TABLE public.deliverables ALTER COLUMN file_url DROP NOT NULL;

-- Add the new status column using v2 enum
DO $$ BEGIN
  ALTER TABLE public.deliverables ADD COLUMN status_v2 public.deliverable_status_v2 NOT NULL DEFAULT 'in_progress';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- -----------------------------------------------
-- 6. DELIVERABLE PHASES (calendar system)
-- -----------------------------------------------

CREATE TABLE IF NOT EXISTS public.deliverable_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.deliverable_phases ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------
-- 7. REVIEW LINKS (shareable public links)
-- -----------------------------------------------

CREATE TABLE IF NOT EXISTS public.review_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.review_links ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------
-- 8. REVIEW RESPONSES (client feedback)
-- -----------------------------------------------

CREATE TABLE IF NOT EXISTS public.review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_link_id UUID NOT NULL REFERENCES public.review_links(id) ON DELETE CASCADE,
  decision public.review_decision NOT NULL,
  feedback TEXT,
  responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------
-- 9. TRIGGER: Auto-update deliverable status on review response
-- -----------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_review_response()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.deliverables
  SET status_v2 = NEW.decision::text::public.deliverable_status_v2
  WHERE id = (
    SELECT deliverable_id FROM public.review_links WHERE id = NEW.review_link_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_response ON public.review_responses;
CREATE TRIGGER on_review_response
  AFTER INSERT ON public.review_responses
  FOR EACH ROW EXECUTE PROCEDURE public.handle_review_response();

-- -----------------------------------------------
-- 10. UPDATED_AT TRIGGERS for new tables
-- -----------------------------------------------

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_deliverable_phases_updated_at
  BEFORE UPDATE ON public.deliverable_phases
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- -----------------------------------------------
-- 11. RLS POLICIES
-- -----------------------------------------------

-- Helper: Check if user is admin
-- (used in policies below as a subquery pattern)

-- ---- BUSINESSES ----

CREATE POLICY "Admins can manage businesses"
  ON public.businesses FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
  );

CREATE POLICY "Collaborators can view businesses they have projects in"
  ON public.businesses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.project_members pm ON pm.project_id = p.id
      WHERE p.business_id = businesses.id AND pm.user_id = auth.uid()
    )
  );

-- ---- PROJECT MEMBERS ----

CREATE POLICY "Admins can manage project members"
  ON public.project_members FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
  );

CREATE POLICY "Users can view their own memberships"
  ON public.project_members FOR SELECT
  USING (user_id = auth.uid());

-- ---- PROJECTS (drop old policies, create new ones) ----

DROP POLICY IF EXISTS "Admins and Managers can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Admins and Managers can manage all projects" ON public.projects;
DROP POLICY IF EXISTS "Clients can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Contractors can view projects they are assigned to" ON public.projects;

CREATE POLICY "Admins can manage all projects"
  ON public.projects FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
  );

CREATE POLICY "Members can view their projects"
  ON public.projects FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = projects.id AND user_id = auth.uid())
  );

-- ---- DELIVERABLES (drop old policies, create new ones) ----

DROP POLICY IF EXISTS "Admins and Managers can manage all deliverables" ON public.deliverables;
DROP POLICY IF EXISTS "Contractors can upload deliverables" ON public.deliverables;
DROP POLICY IF EXISTS "Contractors can view their deliverables" ON public.deliverables;
DROP POLICY IF EXISTS "Clients can view their project deliverables" ON public.deliverables;
DROP POLICY IF EXISTS "Clients can update deliverable status" ON public.deliverables;

CREATE POLICY "Admins can manage all deliverables"
  ON public.deliverables FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
  );

CREATE POLICY "Members can view project deliverables"
  ON public.deliverables FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = deliverables.project_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update project deliverables"
  ON public.deliverables FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = deliverables.project_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert project deliverables"
  ON public.deliverables FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_id AND pm.user_id = auth.uid()
    )
  );

-- ---- DELIVERABLE PHASES ----

CREATE POLICY "Admins can manage all phases"
  ON public.deliverable_phases FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
  );

CREATE POLICY "Members can view project phases"
  ON public.deliverable_phases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deliverables d
      JOIN public.project_members pm ON pm.project_id = d.project_id
      WHERE d.id = deliverable_phases.deliverable_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update project phases"
  ON public.deliverable_phases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.deliverables d
      JOIN public.project_members pm ON pm.project_id = d.project_id
      WHERE d.id = deliverable_phases.deliverable_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert project phases"
  ON public.deliverable_phases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.deliverables d
      JOIN public.project_members pm ON pm.project_id = d.project_id
      WHERE d.id = deliverable_id AND pm.user_id = auth.uid()
    )
  );

-- ---- REVIEW LINKS ----

CREATE POLICY "Admins can manage review links"
  ON public.review_links FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
  );

CREATE POLICY "Members can view and create review links"
  ON public.review_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deliverables d
      JOIN public.project_members pm ON pm.project_id = d.project_id
      WHERE d.id = review_links.deliverable_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert review links"
  ON public.review_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.deliverables d
      JOIN public.project_members pm ON pm.project_id = d.project_id
      WHERE d.id = deliverable_id AND pm.user_id = auth.uid()
    )
  );

-- Public access: allow anon to read a review link by token
CREATE POLICY "Anyone can view active review links by token"
  ON public.review_links FOR SELECT
  USING (is_active = true);

-- ---- REVIEW RESPONSES ----

CREATE POLICY "Admins can view all review responses"
  ON public.review_responses FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
  );

CREATE POLICY "Members can view review responses for their projects"
  ON public.review_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.review_links rl
      JOIN public.deliverables d ON d.id = rl.deliverable_id
      JOIN public.project_members pm ON pm.project_id = d.project_id
      WHERE rl.id = review_responses.review_link_id AND pm.user_id = auth.uid()
    )
  );

-- Allow anyone (anon) to insert a review response (public review page)
CREATE POLICY "Anyone can submit a review response"
  ON public.review_responses FOR INSERT
  WITH CHECK (true);
