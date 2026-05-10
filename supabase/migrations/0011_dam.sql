-- Stage 5: Enterprise Digital Asset Management (DAM)

CREATE TABLE public.digital_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image/png', 'video/mp4', 'application/pdf', etc.
  file_size_bytes BIGINT NOT NULL,
  file_url TEXT NOT NULL, -- Supabase Storage public URL
  thumbnail_url TEXT,     -- Auto-generated thumbnail for videos/large images
  
  tags TEXT[] DEFAULT '{}',
  is_approved BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Realtime Support
ALTER PUBLICATION supabase_realtime ADD TABLE public.digital_assets;

-- RLS
ALTER TABLE public.digital_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read assets"
  ON public.digital_assets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert assets"
  ON public.digital_assets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow admin to manage all assets"
  ON public.digital_assets FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
