-- =============================================================
-- 0024_business_todos.sql
-- Add business linkage to global todos for Account Management
-- =============================================================

DO $$ BEGIN
  ALTER TABLE public.todos ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
