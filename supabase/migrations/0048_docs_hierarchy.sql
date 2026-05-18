ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.documents(id) ON DELETE SET NULL;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'page';
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS template_category TEXT;

CREATE INDEX IF NOT EXISTS idx_documents_parent ON public.documents(parent_id);

CREATE TABLE IF NOT EXISTS public.document_snippets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.document_snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own snippets"
  ON public.document_snippets FOR ALL
  USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
