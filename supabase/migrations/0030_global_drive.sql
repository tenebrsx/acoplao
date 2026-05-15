-- =============================================================
-- 0030_global_drive.sql
-- Digital Asset Manager schema and Storage bucket setup
-- =============================================================

CREATE TABLE IF NOT EXISTS public.drive_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  file_category TEXT NOT NULL, -- 'image', 'video', 'document', 'audio', 'other'
  
  -- Organization
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  
  -- Audit
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.drive_files ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone in the agency can read drive files
CREATE POLICY "Anyone can view drive files"
  ON public.drive_files FOR SELECT
  USING (true);

-- Policy: Authenticated users can upload and manage files
CREATE POLICY "Authenticated users can manage drive files"
  ON public.drive_files FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.drive_files;

-- Insert the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('agency_drive', 'agency_drive', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow public access to read files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'agency_drive' );

-- Allow authenticated users to insert files
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'agency_drive' AND auth.role() = 'authenticated' );

-- Allow authenticated users to update/delete files
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'agency_drive' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'agency_drive' AND auth.role() = 'authenticated' );
