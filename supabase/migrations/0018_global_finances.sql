-- =============================================================
-- 0018_global_finances.sql
-- Global Financial Dashboard schema: Invoices, Expenses, Timesheets.
-- =============================================================

-- -----------------------------------------------
-- 1. ENUMS
-- -----------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.expense_category AS ENUM ('software', 'contractor', 'ad_spend', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------
-- 2. INVOICES TABLE
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  due_date DATE,
  stripe_invoice_id TEXT,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Policies
CREATE POLICY "Admins can manage all invoices"
  ON public.invoices FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true));

-- -----------------------------------------------
-- 3. EXPENSES TABLE
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  category public.expense_category NOT NULL DEFAULT 'other',
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  receipt_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Policies
CREATE POLICY "Admins can manage all expenses"
  ON public.expenses FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true));

-- -----------------------------------------------
-- 4. CONTRACTOR TIMESHEETS TABLE
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.contractor_timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  hours_logged NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  is_invoiced BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contractor_timesheets ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_timesheets_updated_at
  BEFORE UPDATE ON public.contractor_timesheets
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Policies
CREATE POLICY "Admins can manage all timesheets"
  ON public.contractor_timesheets FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true));

CREATE POLICY "Contractors can manage their own timesheets"
  ON public.contractor_timesheets FOR ALL
  USING (contractor_id = auth.uid());

-- -----------------------------------------------
-- 5. AGGREGATION VIEWS / FUNCTIONS
-- -----------------------------------------------
-- Function to get the total net profit per business
CREATE OR REPLACE FUNCTION public.get_business_profit(p_business_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_income NUMERIC(10,2);
  v_expenses NUMERIC(10,2);
BEGIN
  -- Sum paid invoices
  SELECT COALESCE(SUM(amount), 0) INTO v_income
  FROM public.invoices
  WHERE business_id = p_business_id AND status = 'paid';

  -- Sum general expenses
  SELECT COALESCE(SUM(amount), 0) INTO v_expenses
  FROM public.expenses
  WHERE business_id = p_business_id;

  -- Add contractor timesheet costs (hours * rate)
  -- Projects belong to the business, so we join on projects
  SELECT COALESCE(v_expenses + SUM(t.hours_logged * t.hourly_rate), v_expenses) INTO v_expenses
  FROM public.contractor_timesheets t
  JOIN public.projects p ON p.id = t.project_id
  WHERE p.business_id = p_business_id;

  RETURN v_income - v_expenses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
