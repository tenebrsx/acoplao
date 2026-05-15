-- =============================================================
-- 0032_finance_permissions.sql
-- Updates RLS policies for finances to allow managers to manage them.
-- =============================================================

-- Drop existing admin-only policies
DROP POLICY IF EXISTS "Admins can manage all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can manage all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins can manage all invoice items" ON public.invoice_items;

-- Recreate policies to include managers
CREATE POLICY "Admins and managers can manage all invoices"
  ON public.invoices FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true));

CREATE POLICY "Admins and managers can manage all expenses"
  ON public.expenses FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true));

CREATE POLICY "Admins and managers can manage all invoice items"
  ON public.invoice_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true));
