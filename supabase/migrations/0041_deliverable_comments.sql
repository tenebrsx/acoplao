-- =============================================================
-- 0041_deliverable_comments.sql
-- Adds threaded comments to deliverables for team collaboration.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.deliverable_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.deliverable_comments ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_deliverable_comments_updated_at
  BEFORE UPDATE ON public.deliverable_comments
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliverable_comments;

-- RLS Policies
CREATE POLICY "Members can view deliverable comments"
  ON public.deliverable_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deliverables d
      JOIN public.project_members pm ON pm.project_id = d.project_id
      WHERE d.id = deliverable_comments.deliverable_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert deliverable comments"
  ON public.deliverable_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.deliverables d
      JOIN public.project_members pm ON pm.project_id = d.project_id
      WHERE d.id = deliverable_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own comments"
  ON public.deliverable_comments FOR DELETE
  USING (user_id = auth.uid());
