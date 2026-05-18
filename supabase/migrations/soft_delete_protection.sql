-- ============================================================================
-- SOFT DELETE MIGRATION — Agency OS Data Protection Layer
-- ============================================================================
-- Run this in Supabase Dashboard → SQL Editor → New Query → Paste & Run
-- 
-- This adds an `is_deleted` column + `deleted_at` timestamp to critical tables.
-- Existing rows default to is_deleted = false (no data is touched).
-- After running this, update your app code to use soft deletes.
-- ============================================================================

-- 1. BUSINESSES (clients)
ALTER TABLE businesses 
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT null;

-- 2. PROJECTS
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT null;

-- 3. DELIVERABLES
ALTER TABLE deliverables 
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT null;

-- 4. DOCUMENTS (wiki/docs pages — rich authored content)
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT null;

-- 5. INVOICES (financial records — should NEVER be hard-deleted)
ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT null;

-- 6. EXPENSES (financial records)
ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT null;

-- ============================================================================
-- OPTIONAL: Create indexes for fast filtering (recommended)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_businesses_not_deleted ON businesses (is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_projects_not_deleted ON projects (is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_deliverables_not_deleted ON deliverables (is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_documents_not_deleted ON documents (is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_invoices_not_deleted ON invoices (is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_expenses_not_deleted ON expenses (is_deleted) WHERE is_deleted = false;

-- ============================================================================
-- VERIFICATION: Run this after the migration to confirm columns exist
-- ============================================================================
-- SELECT table_name, column_name 
-- FROM information_schema.columns 
-- WHERE column_name IN ('is_deleted', 'deleted_at') 
--   AND table_schema = 'public'
-- ORDER BY table_name;
