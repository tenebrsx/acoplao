-- Add 'planning' to project_status enum
-- This is used by the new Campaign/Project creation flow.

-- Using the same pattern as 0003 to handle idempotency
DO $$ BEGIN
  ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'planning';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
