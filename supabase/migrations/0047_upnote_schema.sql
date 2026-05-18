-- UpNotes Schema: Full-featured note-taking for Aura
-- Migration: 0047

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Notebooks: hierarchical folders
CREATE TABLE IF NOT EXISTS upnote_notebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id uuid REFERENCES upnote_notebooks(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#22c55e',
  icon text DEFAULT 'folder',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notes: the actual content
CREATE TABLE IF NOT EXISTS upnote_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  notebook_id uuid REFERENCES upnote_notebooks(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'Untitled Note',
  content jsonb DEFAULT '{}',
  plain_text text DEFAULT '',
  word_count int DEFAULT 0,
  is_pinned boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  is_daily_note boolean DEFAULT false,
  daily_note_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tags: global tag system with nesting
CREATE TABLE IF NOT EXISTS upnote_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#22c55e',
  parent_id uuid REFERENCES upnote_tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Note-Tags junction
CREATE TABLE IF NOT EXISTS upnote_note_tags (
  note_id uuid REFERENCES upnote_notes(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES upnote_tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (note_id, tag_id)
);

-- Backlinks: bi-directional links between notes
CREATE TABLE IF NOT EXISTS upnote_backlinks (
  source_note_id uuid REFERENCES upnote_notes(id) ON DELETE CASCADE NOT NULL,
  target_note_id uuid REFERENCES upnote_notes(id) ON DELETE CASCADE NOT NULL,
  context_text text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (source_note_id, target_note_id)
);

-- Trashed notes (soft delete with 30-day retention)
CREATE TABLE IF NOT EXISTS upnote_trash (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  note_id uuid NOT NULL,
  title text NOT NULL,
  content jsonb DEFAULT '{}',
  notebook_id uuid,
  deleted_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notebooks_user ON upnote_notebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_notebooks_parent ON upnote_notebooks(parent_id);
CREATE INDEX IF NOT EXISTS idx_notes_user ON upnote_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_notebook ON upnote_notes(notebook_id);
CREATE INDEX IF NOT EXISTS idx_notes_daily ON upnote_notes(user_id, daily_note_date) WHERE is_daily_note = true;
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON upnote_notes(user_id, is_pinned, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_search ON upnote_notes USING gin(plain_text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON upnote_notes(user_id, is_archived, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tags_user ON upnote_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_parent ON upnote_tags(parent_id);
CREATE INDEX IF NOT EXISTS idx_backlinks_target ON upnote_backlinks(target_note_id);
CREATE INDEX IF NOT EXISTS idx_trash_user ON upnote_trash(user_id, deleted_at);

-- Updated at trigger
CREATE OR REPLACE FUNCTION upnote_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER upnote_notebooks_updated
  BEFORE UPDATE ON upnote_notebooks
  FOR EACH ROW EXECUTE FUNCTION upnote_updated_at();

CREATE TRIGGER upnote_notes_updated
  BEFORE UPDATE ON upnote_notes
  FOR EACH ROW EXECUTE FUNCTION upnote_updated_at();

-- RLS Policies
ALTER TABLE upnote_notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE upnote_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE upnote_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE upnote_note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE upnote_backlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE upnote_trash ENABLE ROW LEVEL SECURITY;

-- Notebooks
CREATE POLICY "Users can CRUD own notebooks"
  ON upnote_notebooks FOR ALL
  USING (user_id = auth.uid());

-- Notes
CREATE POLICY "Users can CRUD own notes"
  ON upnote_notes FOR ALL
  USING (user_id = auth.uid());

-- Tags
CREATE POLICY "Users can CRUD own tags"
  ON upnote_tags FOR ALL
  USING (user_id = auth.uid());

-- Note tags
CREATE POLICY "Users can manage tags for own notes"
  ON upnote_note_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM upnote_notes n WHERE n.id = note_id AND n.user_id = auth.uid()
    )
  );

-- Backlinks
CREATE POLICY "Users can view backlinks for own notes"
  ON upnote_backlinks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM upnote_notes n WHERE n.id = source_note_id AND n.user_id = auth.uid()
    )
  );

-- Trash
CREATE POLICY "Users can CRUD own trash"
  ON upnote_trash FOR ALL
  USING (user_id = auth.uid());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE upnote_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE upnote_notebooks;
ALTER PUBLICATION supabase_realtime ADD TABLE upnote_tags;
