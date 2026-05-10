-- =============================================================
-- 0005_todos.sql
-- Global todos / standalone tasks that can be assigned from the calendar.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- RLS
CREATE POLICY "Admins can manage all todos"
  ON public.todos FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
  );

CREATE POLICY "Users can manage their own todos"
  ON public.todos FOR ALL
  USING (assigned_to = auth.uid() OR created_by = auth.uid());
