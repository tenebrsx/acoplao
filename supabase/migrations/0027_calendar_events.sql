-- =============================================================
-- 0027_calendar_events.sql
-- Standalone calendar events table for the agency calendar
-- =============================================================

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT true,
  color TEXT DEFAULT '#00e1ff',
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recurrence_rule TEXT, -- iCal RRULE format for recurring events
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can do everything (agency-internal)
CREATE POLICY "Authenticated users can manage calendar events"
  ON public.calendar_events FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time 
  ON public.calendar_events(start_time);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
