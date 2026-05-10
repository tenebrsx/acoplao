-- =============================================================
-- 0022_content_publishing.sql
-- Adds publishing tracking for content deliverables
-- =============================================================

-- Add publishing columns to deliverables
ALTER TABLE public.deliverables 
ADD COLUMN IF NOT EXISTS published_url TEXT,
ADD COLUMN IF NOT EXISTS publish_date DATE;

-- Update the deliverable_status_v2 enum to include 'published'
-- Postgres doesn't allow adding to ENUMs easily inside a transaction if used as default,
-- but since we are just adding a value, we can do it outside a transaction block.
ALTER TYPE public.deliverable_status_v2 ADD VALUE IF NOT EXISTS 'published';
