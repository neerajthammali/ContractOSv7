-- Update the database schema with better constraints and indexes
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'engineer', 'user')),
  company TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (length(name) > 0),
  client TEXT NOT NULL CHECK (length(client) > 0),
  location TEXT NOT NULL CHECK (length(location) > 0),
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on-hold', 'completed')),
  description TEXT,
  budget NUMERIC DEFAULT 0 CHECK (budget >= 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  project_type TEXT CHECK (project_type IN ('residential', 'commercial', 'industrial', 'infrastructure', 'renovation')),
  team_size INTEGER DEFAULT 0 CHECK (team_size >= 0),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL CHECK (length(title) > 0),
  description TEXT,
  status TEXT DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in-progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assignee TEXT,
  due_date DATE,
  estimated_hours INTEGER CHECK (estimated_hours > 0),
  actual_hours INTEGER CHECK (actual_hours >= 0),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create milestones table
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL CHECK (length(title) > 0),
  description TEXT,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create issues table
CREATE TABLE IF NOT EXISTS public.issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL CHECK (length(title) > 0),
  description TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
  assignee TEXT,
  reporter TEXT,
  resolution_notes TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_reports table
CREATE TABLE IF NOT EXISTS public.daily_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_date DATE NOT NULL,
  weather_conditions TEXT,
  temperature NUMERIC,
  work_completed TEXT,
  labor_hours INTEGER DEFAULT 0 CHECK (labor_hours >= 0),
  materials_used TEXT,
  equipment_used TEXT,
  issues_encountered TEXT,
  safety_incidents TEXT,
  photos TEXT[], -- Array of photo URLs
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, report_date) -- One report per project per day
);

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (length(name) > 0),
  file_path TEXT NOT NULL,
  file_size INTEGER CHECK (file_size > 0),
  file_type TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'contract', 'blueprint', 'permit', 'rfi', 'photo', 'report')),
  description TEXT,
  version INTEGER DEFAULT 1 CHECK (version > 0),
  is_active BOOLEAN DEFAULT true,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create budget_items table
CREATE TABLE IF NOT EXISTS public.budget_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL CHECK (length(category) > 0),
  description TEXT,
  planned_cost NUMERIC DEFAULT 0 CHECK (planned_cost >= 0),
  actual_cost NUMERIC DEFAULT 0 CHECK (actual_cost >= 0),
  variance_percentage NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN planned_cost > 0 THEN ((actual_cost - planned_cost) / planned_cost) * 100
      ELSE 0
    END
  ) STORED,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table for project team management
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('manager', 'engineer', 'supervisor', 'worker', 'member')),
  hourly_rate NUMERIC CHECK (hourly_rate >= 0),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id) -- One role per user per project
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Drop existing policies for projects
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

-- Create RLS policies for projects
CREATE POLICY "Users can view own projects" ON public.projects
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

CREATE POLICY "Users can update own projects" ON public.projects
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

-- Drop existing policies for tasks
DROP POLICY IF EXISTS "Users can view tasks in own projects" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks in own projects" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks in own projects" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks in own projects" ON public.tasks;

-- Create RLS policies for tasks
CREATE POLICY "Users can view tasks in own projects" ON public.tasks
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

CREATE POLICY "Users can create tasks in own projects" ON public.tasks
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

CREATE POLICY "Users can update tasks in own projects" ON public.tasks
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

CREATE POLICY "Users can delete tasks in own projects" ON public.tasks
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

-- Create similar RLS policies for other tables
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

CREATE POLICY "Users can manage team members in own projects" ON public.team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = team_members.project_id 
      AND projects.created_by = auth.uid()
    ) OR team_members.user_id = auth.uid()
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON public.projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON public.projects(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_due_date ON public.milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON public.milestones(status);

CREATE INDEX IF NOT EXISTS idx_issues_project_id ON public.issues(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON public.issues(severity);

CREATE INDEX IF NOT EXISTS idx_daily_reports_project_id ON public.daily_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON public.daily_reports(report_date);

CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_active ON public.documents(is_active);

CREATE INDEX IF NOT EXISTS idx_budget_items_project_id ON public.budget_items(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_category ON public.budget_items(category);

CREATE INDEX IF NOT EXISTS idx_team_members_project_id ON public.team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON public.team_members(is_active);

-- Create functions for automatic profile creation and updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create triggers for updated_at timestamps
CREATE TRIGGER handle_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at_projects BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at_tasks BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at_milestones BEFORE UPDATE ON public.milestones FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at_issues BEFORE UPDATE ON public.issues FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at_daily_reports BEFORE UPDATE ON public.daily_reports FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at_documents BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at_budget_items BEFORE UPDATE ON public.budget_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at_team_members BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create views for better data access
CREATE OR REPLACE VIEW public.project_stats AS
SELECT 
  p.id,
  p.name,
  p.status,
  p.progress,
  p.budget,
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN t.status = 'in-progress' THEN 1 END) as in_progress_tasks,
  COUNT(CASE WHEN t.status IN ('backlog', 'todo') THEN 1 END) as pending_tasks,
  COALESCE(SUM(bi.actual_cost), 0) as actual_cost,
  COALESCE(SUM(bi.planned_cost), 0) as planned_cost,
  COUNT(DISTINCT tm.user_id) as team_member_count
FROM public.projects p
LEFT JOIN public.tasks t ON p.id = t.project_id
LEFT JOIN public.budget_items bi ON p.id = bi.project_id
LEFT JOIN public.team_members tm ON p.id = tm.project_id AND tm.is_active = true
GROUP BY p.id, p.name, p.status, p.progress, p.budget;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.project_stats TO authenticated;
