-- =============================================================
-- 0004_documents.sql
-- Collaborative documents system with sharing capabilities.
-- =============================================================

-- -----------------------------------------------
-- 1. DOCUMENTS TABLE
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content JSONB DEFAULT '{}',
  
  -- Optional scoping (can be standalone or linked to a project/business)
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  
  -- Ownership
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Sharing
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  -- Metadata
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- 2. DOCUMENT COLLABORATORS (access control)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin')),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(document_id, user_id)
);

-- -----------------------------------------------
-- 3. INDEXES
-- -----------------------------------------------
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON public.documents(created_by);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_business_id ON public.documents(business_id);
CREATE INDEX IF NOT EXISTS idx_documents_share_token ON public.documents(share_token);
CREATE INDEX IF NOT EXISTS idx_document_collaborators_user ON public.document_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_document_collaborators_doc ON public.document_collaborators(document_id);

-- -----------------------------------------------
-- 4. AUTO-UPDATE TIMESTAMP
-- -----------------------------------------------
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- -----------------------------------------------
-- 5. ROW LEVEL SECURITY
-- -----------------------------------------------
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_collaborators ENABLE ROW LEVEL SECURITY;

-- Admins: full access to documents
CREATE POLICY "Admins can manage all documents"
  ON public.documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

-- Creators: full access to own documents
CREATE POLICY "Creators can manage own documents"
  ON public.documents FOR ALL
  USING (created_by = auth.uid());

-- Collaborators: can view/edit based on permission
CREATE POLICY "Collaborators can view shared documents"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.document_collaborators
      WHERE document_id = documents.id AND user_id = auth.uid()
    )
  );

-- Public docs: anyone can view via share token (handled at app level)
-- No RLS policy needed since public pages use service role or skip auth.

-- Collaborator table policies
CREATE POLICY "Admins can manage document collaborators"
  ON public.document_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

CREATE POLICY "Document owners can manage collaborators"
  ON public.document_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE id = document_collaborators.document_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view their own collaborator entries"
  ON public.document_collaborators FOR SELECT
  USING (user_id = auth.uid());
