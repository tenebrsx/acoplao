-- Sidebar workspace sections (e.g. "Marketing", "Ops")
CREATE TABLE public.workspace_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Untitled Section',
  icon TEXT,                          -- emoji or lucide icon name
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pages nested inside a section
CREATE TABLE public.workspace_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES workspace_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Page',
  page_type TEXT NOT NULL CHECK (page_type IN ('doc', 'kanban', 'table')),
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generic content store — used by all three page types
-- 'doc'    → content = Tiptap JSON
-- 'kanban' → content = { columns: [{id, title, color}], cards: [{id, columnId, title, assignee, due_date}] }
-- 'table'  → content = { columns: [{id, title, type}], rows: [{id, cells: {colId: value}}] }
CREATE TABLE public.workspace_page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID UNIQUE REFERENCES workspace_pages(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.workspace_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_page_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users (workspace_sections)"
  ON public.workspace_sections FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users (workspace_pages)"
  ON public.workspace_pages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users (workspace_page_content)"
  ON public.workspace_page_content FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
