-- =============================================================
-- 0035_crm_depth.sql
-- Expand Leads with follow-ups and activity timeline
-- =============================================================

-- Add new fields to leads table
ALTER TABLE public.leads ADD COLUMN follow_up_date DATE;
ALTER TABLE public.leads ADD COLUMN lead_source TEXT;
ALTER TABLE public.leads ADD COLUMN estimated_close_date DATE;
ALTER TABLE public.leads ADD COLUMN priority TEXT DEFAULT 'medium'; -- 'low', 'medium', 'high'

-- Create lead activities table for timeline
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'note', 'email', 'call', 'status_change'
  content TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for lead activities
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Policies for lead activities
CREATE POLICY "Admins and managers can manage lead activities"
  ON public.lead_activities FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true));

-- Update Leads policies if they only allowed admins before (just in case, allow managers)
DROP POLICY IF EXISTS "Admins can view and manage leads" ON public.leads;

CREATE POLICY "Admins and managers can manage leads"
  ON public.leads FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true));
