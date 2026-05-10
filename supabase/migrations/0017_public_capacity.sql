-- Allow public access to Capacity Planning data
-- This is to satisfy the requirement "make it like not ask for a login" for the capacity tab.

-- 1. Profiles: Allow anyone to see active team members (contractors/admins)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (is_active = true AND role != 'client');

-- 2. Projects: Allow anyone to see project titles for the Gantt chart
CREATE POLICY "Public projects are viewable by everyone" 
ON public.projects FOR SELECT 
USING (true);

-- 3. Deliverables: Allow anyone to see deliverables for the Gantt chart
CREATE POLICY "Public deliverables are viewable by everyone" 
ON public.deliverables FOR SELECT 
USING (true);

-- 4. Deliverable Phases: Allow anyone to see phases for the Gantt chart
CREATE POLICY "Public deliverable phases are viewable by everyone" 
ON public.deliverable_phases FOR SELECT 
USING (true);
