-- Create ENUMs
CREATE TYPE public.project_status AS ENUM ('active', 'review', 'completed');
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE public.deliverable_status AS ENUM ('pending_review', 'approved', 'rejected');

-- Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.project_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.task_status NOT NULL DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deliverables Table
CREATE TABLE IF NOT EXISTS public.deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.deliverable_status NOT NULL DEFAULT 'pending_review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- Policies for Projects
-- --------------------------------------------------------

-- Admins and Managers can view all projects
CREATE POLICY "Admins and Managers can view all projects"
  ON public.projects FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true)
  );

-- Admins and Managers can manage all projects
CREATE POLICY "Admins and Managers can manage all projects"
  ON public.projects FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true)
  );

-- Clients can only view their own projects
CREATE POLICY "Clients can view own projects"
  ON public.projects FOR SELECT
  USING (client_id = auth.uid());

-- Contractors can view projects they have tasks in
CREATE POLICY "Contractors can view projects they are assigned to"
  ON public.projects FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.tasks WHERE project_id = projects.id AND assigned_to = auth.uid())
  );

-- --------------------------------------------------------
-- Policies for Tasks
-- --------------------------------------------------------

-- Admins and Managers can view/manage all tasks
CREATE POLICY "Admins and Managers can manage all tasks"
  ON public.tasks FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true)
  );

-- Contractors can view tasks assigned to them
CREATE POLICY "Contractors can view their tasks"
  ON public.tasks FOR SELECT
  USING (assigned_to = auth.uid());

-- Contractors can update status of tasks assigned to them
CREATE POLICY "Contractors can update their tasks"
  ON public.tasks FOR UPDATE
  USING (assigned_to = auth.uid());

-- --------------------------------------------------------
-- Policies for Deliverables
-- --------------------------------------------------------

-- Admins and Managers can view/manage all deliverables
CREATE POLICY "Admins and Managers can manage all deliverables"
  ON public.deliverables FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true)
  );

-- Contractors can insert deliverables for projects they are assigned to
CREATE POLICY "Contractors can upload deliverables"
  ON public.deliverables FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.tasks WHERE project_id = deliverables.project_id AND assigned_to = auth.uid())
    AND uploaded_by = auth.uid()
  );

-- Contractors can view deliverables they uploaded
CREATE POLICY "Contractors can view their deliverables"
  ON public.deliverables FOR SELECT
  USING (uploaded_by = auth.uid());

-- Clients can view deliverables for their projects
CREATE POLICY "Clients can view their project deliverables"
  ON public.deliverables FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = deliverables.project_id AND client_id = auth.uid())
  );

-- Clients can update deliverable status (approve/reject)
CREATE POLICY "Clients can update deliverable status"
  ON public.deliverables FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = deliverables.project_id AND client_id = auth.uid())
  );

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_deliverables_updated_at
  BEFORE UPDATE ON public.deliverables
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
