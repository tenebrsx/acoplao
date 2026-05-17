-- Ensure 'planning' and 'paused' exist in project_status enum
-- Using a robust check to avoid failures if they already exist.

-- Since ALTER TYPE ADD VALUE cannot be in a DO block in some versions,
-- we'll use a trick or just run them and ignore errors if possible, 
-- but Supabase CLI doesn't like errors.

-- Actually, ADD VALUE IF NOT EXISTS is NOT standard but often used in Supabase/Postgres 13+.
-- Let's try to detect if it's needed first.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'project_status' AND e.enumlabel = 'planning') THEN
        EXECUTE 'ALTER TYPE public.project_status ADD VALUE ''planning''';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'project_status' AND e.enumlabel = 'paused') THEN
        EXECUTE 'ALTER TYPE public.project_status ADD VALUE ''paused''';
    END IF;
END
$$;
