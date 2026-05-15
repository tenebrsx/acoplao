-- =============================================================
-- 0034_recurring_invoices.sql
-- Add recurring flag to invoices for retainer billing
-- =============================================================

ALTER TABLE public.invoices ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.invoices ADD COLUMN recurring_interval TEXT DEFAULT 'monthly'; -- e.g., 'weekly', 'monthly', 'yearly'
