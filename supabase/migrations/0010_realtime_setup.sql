-- Enable Supabase Realtime for core tables to support Phase 1 Refinement

-- This adds tables to the 'supabase_realtime' publication so they broadcast changes.
-- Note: 'supabase_realtime' publication usually exists by default in Supabase.
-- If it doesn't, this will create it or alter it.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.automations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliverables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliverable_phases;
