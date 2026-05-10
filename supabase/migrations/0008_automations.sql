-- Automations Rule Engine
CREATE TABLE public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- e.g., 'deliverable', 'lead', 'project'
  trigger_event TEXT NOT NULL, -- e.g., 'status_changed', 'created'
  trigger_condition JSONB, -- e.g., {"field": "status", "value": "ready_for_review"}
  action_type TEXT NOT NULL, -- e.g., 'send_email', 'webhook', 'update_record'
  action_payload JSONB NOT NULL, -- e.g., {"to": "client_email", "template": "review_ready"}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Execution Logs for Automations
CREATE TABLE public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES automations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  status TEXT NOT NULL, -- 'success', 'failed'
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin full access to automations"
  ON public.automations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow admin full access to automation logs"
  ON public.automation_logs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
