-- -----------------------------------------------
-- 0025_deliverable_workspace.sql
-- Upgrades deliverables to a full workspace architecture.
-- Adds deliverable_assets (media) and deliverable_feedback (timestamped reviews).
-- -----------------------------------------------

-- 0. Link Todos to Deliverables
DO $$ BEGIN
  ALTER TABLE public.todos ADD COLUMN deliverable_id UUID REFERENCES public.deliverables(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 0.1 Storage Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('deliverables', 'deliverables', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public Deliverables" ON storage.objects FOR SELECT USING (bucket_id = 'deliverables');
CREATE POLICY "Authenticated Users can upload deliverables" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'deliverables' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated Users can update deliverables" ON storage.objects FOR UPDATE USING (bucket_id = 'deliverables' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated Users can delete deliverables" ON storage.objects FOR DELETE USING (bucket_id = 'deliverables' AND auth.role() = 'authenticated');

-- 1. Deliverable Assets Table (DAM specific to deliverables)
CREATE TABLE IF NOT EXISTS public.deliverable_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image/png', 'video/mp4', 'application/pdf', etc.
  file_size_bytes BIGINT NOT NULL,
  file_url TEXT NOT NULL, -- Supabase Storage path/URL
  thumbnail_url TEXT,
  
  version_number INT NOT NULL DEFAULT 1,
  is_approved BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.deliverable_assets ENABLE ROW LEVEL SECURITY;

-- 2. Deliverable Asset Feedback Table (Frame/Coordinate specific comments)
CREATE TABLE IF NOT EXISTS public.deliverable_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.deliverable_assets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Null if client is anonymous/token based
  
  comment TEXT NOT NULL,
  
  -- Context metadata for the comment
  video_timestamp_seconds NUMERIC(10, 3), -- If commenting on a specific video frame
  image_coordinate_x NUMERIC(5, 2), -- Percentage X
  image_coordinate_y NUMERIC(5, 2), -- Percentage Y
  
  is_resolved BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.deliverable_feedback ENABLE ROW LEVEL SECURITY;

-- 3. Add updated_at trigger for assets
CREATE TRIGGER update_deliverable_assets_updated_at
  BEFORE UPDATE ON public.deliverable_assets
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_deliverable_feedback_updated_at
  BEFORE UPDATE ON public.deliverable_feedback
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Realtime Setup
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliverable_assets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliverable_feedback;

-- -----------------------------------------------
-- RLS POLICIES
-- -----------------------------------------------

-- Deliverable Assets
CREATE POLICY "Admins can manage all deliverable assets"
  ON public.deliverable_assets FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
  );

CREATE POLICY "Members can view project deliverable assets"
  ON public.deliverable_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deliverables d
      JOIN public.project_members pm ON pm.project_id = d.project_id
      WHERE d.id = deliverable_assets.deliverable_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert project deliverable assets"
  ON public.deliverable_assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.deliverables d
      JOIN public.project_members pm ON pm.project_id = d.project_id
      WHERE d.id = deliverable_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update project deliverable assets"
  ON public.deliverable_assets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.deliverables d
      JOIN public.project_members pm ON pm.project_id = d.project_id
      WHERE d.id = deliverable_assets.deliverable_id AND pm.user_id = auth.uid()
    )
  );

-- Deliverable Feedback
CREATE POLICY "Admins can manage all deliverable feedback"
  ON public.deliverable_feedback FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
  );

CREATE POLICY "Members can view deliverable feedback"
  ON public.deliverable_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deliverable_assets da
      JOIN public.deliverables d ON d.id = da.deliverable_id
      JOIN public.project_members pm ON pm.project_id = d.project_id
      WHERE da.id = deliverable_feedback.asset_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert deliverable feedback"
  ON public.deliverable_feedback FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.deliverable_assets da
      JOIN public.deliverables d ON d.id = da.deliverable_id
      JOIN public.project_members pm ON pm.project_id = d.project_id
      WHERE da.id = asset_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update their own feedback"
  ON public.deliverable_feedback FOR UPDATE
  USING (user_id = auth.uid());
