-- =============================================================
-- 0026_fix_schema_gaps.sql
-- Adds missing columns and fixes schema inconsistencies
-- =============================================================

-- 1. Add missing 'type' column to deliverables
-- Used by BusinessCommandCenter templates and filtering
ALTER TABLE public.deliverables 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'other';

-- 2. Add missing capacity-planning columns to deliverable_phases
-- Used by the Capacity Gantt chart
ALTER TABLE public.deliverable_phases 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Add 'title' column to deliverables if missing
-- (BusinessCommandCenter and other pages reference it)
ALTER TABLE public.deliverables 
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Untitled';

-- 4. Add 'status_v2' to deliverables if missing
-- The newer workflow status enum
DO $$ BEGIN
  CREATE TYPE public.deliverable_status_v2 AS ENUM (
    'in_progress', 'in_review', 'revision', 'approved', 'published'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.deliverables 
ADD COLUMN IF NOT EXISTS status_v2 public.deliverable_status_v2 DEFAULT 'in_progress';

-- 5. Add 'created_by' to deliverables if missing
ALTER TABLE public.deliverables 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 6. Add 'business_id' to projects if missing (used by business command center)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;

-- 7. Add 'created_by' to projects if missing
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
