-- ContractOS Row Level Security Policies
-- Run this script after the main database setup

-- Drop all existing policies first
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on public schema tables
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view accessible projects" ON public.projects
  FOR SELECT USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_members.project_id = projects.id 
      AND team_members.user_id = auth.uid() 
      AND team_members.is_active = true
    )
  );

CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update accessible projects" ON public.projects
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_members.project_id = projects.id 
      AND team_members.user_id = auth.uid() 
      AND team_members.role IN ('manager', 'engineer')
      AND team_members.is_active = true
    )
  );

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = created_by);

-- Tasks policies
CREATE POLICY "Users can view tasks in accessible projects" ON public.tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = tasks.project_id 
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.team_members 
          WHERE team_members.project_id = projects.id 
          AND team_members.user_id = auth.uid() 
          AND team_members.is_active = true
        )
      )
    )
  );

CREATE POLICY "Users can create tasks in accessible projects" ON public.tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = tasks.project_id 
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.team_members 
          WHERE team_members.project_id = projects.id 
          AND team_members.user_id = auth.uid() 
          AND team_members.is_active = true
        )
      )
    )
  );

CREATE POLICY "Users can update tasks in accessible projects" ON public.tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = tasks.project_id 
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.team_members 
          WHERE team_members.project_id = projects.id 
          AND team_members.user_id = auth.uid() 
          AND team_members.is_active = true
        )
      )
    )
  );

CREATE POLICY "Users can delete tasks in accessible projects" ON public.tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = tasks.project_id 
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.team_members 
          WHERE team_members.project_id = projects.id 
          AND team_members.user_id = auth.uid() 
          AND team_members.role IN ('manager', 'engineer')
          AND team_members.is_active = true
        )
      )
    )
  );

-- Milestones policies
CREATE POLICY "Users can manage milestones in accessible projects" ON public.milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = milestones.project_id 
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.team_members 
          WHERE team_members.project_id = projects.id 
          AND team_members.user_id = auth.uid() 
          AND team_members.is_active = true
        )
      )
    )
  );

-- Issues policies
CREATE POLICY "Users can manage issues in accessible projects" ON public.issues
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = issues.project_id 
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.team_members 
          WHERE team_members.project_id = projects.id 
          AND team_members.user_id = auth.uid() 
          AND team_members.is_active = true
        )
      )
    )
  );

-- Daily reports policies
CREATE POLICY "Users can manage reports in accessible projects" ON public.daily_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = daily_reports.project_id 
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.team_members 
          WHERE team_members.project_id = projects.id 
          AND team_members.user_id = auth.uid() 
          AND team_members.is_active = true
        )
      )
    )
  );

-- Documents policies
CREATE POLICY "Users can manage documents in accessible projects" ON public.documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = documents.project_id 
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.team_members 
          WHERE team_members.project_id = projects.id 
          AND team_members.user_id = auth.uid() 
          AND team_members.is_active = true
        )
      )
    )
  );

-- Budget items policies
CREATE POLICY "Users can manage budget items in accessible projects" ON public.budget_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = budget_items.project_id 
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.team_members 
          WHERE team_members.project_id = projects.id 
          AND team_members.user_id = auth.uid() 
          AND team_members.role IN ('manager', 'engineer')
          AND team_members.is_active = true
        )
      )
    )
  );

-- Team members policies
CREATE POLICY "Users can manage team members in own projects" ON public.team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = team_members.project_id 
      AND projects.created_by = auth.uid()
    ) OR team_members.user_id = auth.uid()
  );

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
