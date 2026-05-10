-- Leads Table for CRM Pipeline
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  budget TEXT,
  project_type TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'proposal_sent', 'won', 'lost')),
  assigned_to UUID REFERENCES profiles(id),
  converted_business_id UUID REFERENCES businesses(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow public insertion (for the inbound lead form on marketing sites)
CREATE POLICY "Allow public insert to leads"
  ON public.leads FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow authenticated users to view and update leads
CREATE POLICY "Allow authenticated full access to leads"
  ON public.leads FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
