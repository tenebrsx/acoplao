-- =============================================================
-- 0036_content_briefs.sql
-- Adds 'creative_brief' field and 'is_client_visible' flag
-- to the deliverables (Content Assets) table to support the
-- new Notion-like Workspace side-panel.
-- =============================================================

DO $$ BEGIN
  ALTER TABLE public.deliverables ADD COLUMN creative_brief JSONB;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.deliverables ADD COLUMN is_client_visible BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
