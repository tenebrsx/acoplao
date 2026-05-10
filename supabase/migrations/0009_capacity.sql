-- Stage 4: Capacity Planning & Time Tracking

-- Add date constraints to deliverable_phases for Gantt charts
ALTER TABLE public.deliverable_phases
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(5,2);

-- Time Tracking Table
CREATE TABLE public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES deliverable_phases(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER, -- calculated automatically or manual entry
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own time, admins see all
CREATE POLICY "Users manage own time, admins full access"
  ON public.time_entries FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
