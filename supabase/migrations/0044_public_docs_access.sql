-- =============================================================
-- 0032_public_docs_access.sql
-- Temporary migration to allow public access to documents
-- for a "login-free" development experience.
-- =============================================================

-- Allow anyone to create documents
DROP POLICY IF EXISTS "Anyone can create documents" ON public.documents;
CREATE POLICY "Anyone can create documents"
  ON public.documents FOR INSERT
  WITH CHECK (true);

-- Allow anyone to view all documents
DROP POLICY IF EXISTS "Anyone can view all documents" ON public.documents;
CREATE POLICY "Anyone can view all documents"
  ON public.documents FOR SELECT
  USING (true);

-- Allow anyone to update all documents
DROP POLICY IF EXISTS "Anyone can update all documents" ON public.documents;
CREATE POLICY "Anyone can update all documents"
  ON public.documents FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete all documents
DROP POLICY IF EXISTS "Anyone can delete all documents" ON public.documents;
CREATE POLICY "Anyone can delete all documents"
  ON public.documents FOR DELETE
  USING (true);

-- Also open up profiles for the dev fallbacks
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);
